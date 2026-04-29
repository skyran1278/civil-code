/**
 * One-shot script: read the regulation PDF and produce data/concrete-design-code.json.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=... npx tsx scripts/ingest.ts data/raw/concrete-design-code-112.pdf
 *
 * v1 trusts the LLM extraction (no manual review). If answer quality is poor,
 * inspect data/concrete-design-code.json directly and correct entries.
 */

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { corpusSchema, extractionResultSchema } from "../lib/schemas";

const EXTRACTION_TOOL_NAME = "emit_articles";

const EXTRACTION_PROMPT = `你是一個結構化文件擷取助手。輸入是「建築物混凝土結構設計規範及解說」(GL000236, 112 年版) 的 PDF。

請逐條擷取每一條規範與其解說，呼叫 \`${EXTRACTION_TOOL_NAME}\` 工具回傳結果。每筆 article 包含：

- id：條編號（例如 "3.7.5"、"15.5.4"，使用點號分隔；附錄類別用「附錄 X.Y」格式）
- chapter：所屬章標題（含中文章名）
- section：所屬節標題
- subsection：條的完整標題（含條號）
- body：規範本文 verbatim（逐字、保留全形/半形空白與標點，不得改寫、總結、補空白）
- commentary：對應【解說】verbatim，沒有則為 null
- tables：永遠為空陣列（表格暫時不擷取）
- reviewed：永遠為 false`;

interface ExtractionInput {
  pdfPath: string;
  outPath: string;
  model: string;
}

async function extract(input: ExtractionInput): Promise<void> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const client = new Anthropic({ apiKey });
  const pdfData = readFileSync(input.pdfPath);
  const pdfBase64 = pdfData.toString("base64");

  console.log(`Sending ${input.pdfPath} (${pdfData.length} bytes) to ${input.model}…`);

  const inputSchema = z.toJSONSchema(extractionResultSchema) as {
    type: "object";
    [k: string]: unknown;
  };

  const response = await client.messages.create({
    model: input.model,
    max_tokens: 64000,
    tools: [
      {
        name: EXTRACTION_TOOL_NAME,
        description:
          "Emit the structured list of articles extracted verbatim from the regulation PDF.",
        input_schema: inputSchema,
      },
    ],
    tool_choice: { type: "tool", name: EXTRACTION_TOOL_NAME },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: { type: "base64", media_type: "application/pdf", data: pdfBase64 },
          },
          { type: "text", text: EXTRACTION_PROMPT },
        ],
      },
    ],
  });

  const toolUse = response.content.find(
    (c) => c.type === "tool_use" && c.name === EXTRACTION_TOOL_NAME
  );
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error(
      `Claude response missing tool_use block for ${EXTRACTION_TOOL_NAME}`
    );
  }

  const parsed = extractionResultSchema.parse(toolUse.input);
  const corpus = corpusSchema.parse({
    meta: {
      law_id: "GL000236",
      law_name: "建築物混凝土結構設計規範",
      version: "112年8月10日修正",
      source_url: "https://glrs.moi.gov.tw/LawContent.aspx?id=GL000236",
      ingested_at: new Date().toISOString().slice(0, 10),
      model_used_for_ingest: input.model,
    },
    articles: parsed.articles,
  });

  writeFileSync(input.outPath, JSON.stringify(corpus, null, 2), "utf-8");
  console.log(`Wrote ${corpus.articles.length} articles to ${input.outPath}`);
}

const pdfArg = process.argv[2];
if (!pdfArg) {
  console.error("Usage: tsx scripts/ingest.ts <path-to-pdf>");
  process.exit(1);
}

extract({
  pdfPath: path.resolve(pdfArg),
  outPath: path.resolve("data/concrete-design-code.json"),
  model: process.env.INGEST_MODEL ?? "claude-opus-4-7",
}).catch((e) => {
  console.error(e);
  process.exit(1);
});
