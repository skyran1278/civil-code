import { describe, it, expect, vi } from "vitest";
import { createAskHandler } from "@/lib/ask-handler";
import type { ClaudeClient, AskResult } from "@/lib/claude";
import type { Corpus } from "@/lib/corpus-types";

const corpus: Corpus = {
  meta: {
    law_id: "GL000236",
    law_name: "建築物混凝土結構設計規範",
    version: "112年8月10日修正",
    source_url: "https://glrs.moi.gov.tw/LawContent.aspx?id=GL000236",
    ingested_at: "2026-04-29",
    model_used_for_ingest: "claude-opus-4-7",
  },
  articles: [
    {
      id: "15.5.4",
      chapter: "第十五章",
      section: "15.5",
      subsection: "15.5.4 箍筋",
      body: "箍筋之間距不得超過 d/4。",
      commentary: null,
      tables: [],
      reviewed: false,
    },
  ],
};

const baseTrace = {
  model: "claude-sonnet-4-6",
  cache_hit: true,
  input_tokens: 100,
  output_tokens: 20,
  cache_read_input_tokens: 80,
  cache_creation_input_tokens: 0,
  latency_ms: 1234,
};

function makeClaudeClient(result: AskResult): ClaudeClient {
  return { ask: vi.fn().mockResolvedValue(result) };
}

function reqWithBody(body: unknown): Request {
  return new Request("http://localhost/api/ask", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("createAskHandler", () => {
  it("returns 200 with verified citations when LLM cites valid quotes", async () => {
    const claudeClient = makeClaudeClient({
      answer: {
        answer: "箍筋之間距不得超過 d/4",
        citations: [
          { article_id: "15.5.4", quote: "箍筋之間距不得超過 d/4", source: "body" },
        ],
      },
      trace: baseTrace,
    });
    const handler = createAskHandler({
      corpus,
      claudeClient,
      defaultModel: "claude-sonnet-4-6",
    });

    const res = await handler(reqWithBody({ question: "箍筋最大間距?" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.answer).toBe("箍筋之間距不得超過 d/4");
    expect(json.citations).toEqual([
      {
        article_id: "15.5.4",
        quote: "箍筋之間距不得超過 d/4",
        source: "body",
        verified: true,
      },
    ]);
    expect(json.trace).toMatchObject({ model: "claude-sonnet-4-6", cache_hit: true });
  });

  it("returns 422 when any citation fails verbatim verification", async () => {
    const claudeClient = makeClaudeClient({
      answer: {
        answer: "箍筋最大間距為 100 mm",
        citations: [
          {
            article_id: "15.5.4",
            quote: "箍筋之間距不得超過 100 mm", // not in body
            source: "body",
          },
        ],
      },
      trace: baseTrace,
    });
    const handler = createAskHandler({
      corpus,
      claudeClient,
      defaultModel: "claude-sonnet-4-6",
    });

    const res = await handler(reqWithBody({ question: "Q" }));
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error).toBe("citation_verification_failed");
    expect(json.details).toHaveLength(1);
    expect(json.details[0].reason).toBe("quote_not_found");
  });

  it("returns 422 when an article id does not exist", async () => {
    const claudeClient = makeClaudeClient({
      answer: {
        answer: "x",
        citations: [{ article_id: "99.9.9", quote: "x", source: "body" }],
      },
      trace: baseTrace,
    });
    const handler = createAskHandler({
      corpus,
      claudeClient,
      defaultModel: "claude-sonnet-4-6",
    });

    const res = await handler(reqWithBody({ question: "Q" }));
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.details[0].reason).toBe("article_not_found");
  });

  it("returns 400 for empty question", async () => {
    const claudeClient = makeClaudeClient({
      answer: { answer: "x", citations: [] },
      trace: baseTrace,
    });
    const handler = createAskHandler({
      corpus,
      claudeClient,
      defaultModel: "claude-sonnet-4-6",
    });

    const res = await handler(reqWithBody({ question: "" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("invalid_request");
    expect(claudeClient.ask).not.toHaveBeenCalled();
  });

  it("returns 400 when body is not valid JSON", async () => {
    const handler = createAskHandler({
      corpus,
      claudeClient: makeClaudeClient({
        answer: { answer: "x", citations: [] },
        trace: baseTrace,
      }),
      defaultModel: "claude-sonnet-4-6",
    });
    const req = new Request("http://localhost/api/ask", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not json",
    });
    const res = await handler(req);
    expect(res.status).toBe(400);
  });

  it("uses defaultModel when no model specified", async () => {
    const claudeClient = makeClaudeClient({
      answer: { answer: "規範中未明訂", citations: [] },
      trace: baseTrace,
    });
    const handler = createAskHandler({
      corpus,
      claudeClient,
      defaultModel: "claude-sonnet-4-6",
    });

    await handler(reqWithBody({ question: "What is X?" }));
    expect(claudeClient.ask).toHaveBeenCalledWith(
      expect.objectContaining({ model: "claude-sonnet-4-6" })
    );
  });

  it("uses requested model when specified", async () => {
    const claudeClient = makeClaudeClient({
      answer: { answer: "規範中未明訂", citations: [] },
      trace: baseTrace,
    });
    const handler = createAskHandler({
      corpus,
      claudeClient,
      defaultModel: "claude-sonnet-4-6",
    });

    await handler(reqWithBody({ question: "Q", model: "claude-opus-4-7" }));
    expect(claudeClient.ask).toHaveBeenCalledWith(
      expect.objectContaining({ model: "claude-opus-4-7" })
    );
  });

  it("rejects an unknown model with 400", async () => {
    const claudeClient = makeClaudeClient({
      answer: { answer: "x", citations: [] },
      trace: baseTrace,
    });
    const handler = createAskHandler({
      corpus,
      claudeClient,
      defaultModel: "claude-sonnet-4-6",
    });

    const res = await handler(reqWithBody({ question: "Q", model: "gpt-4" }));
    expect(res.status).toBe(400);
    expect(claudeClient.ask).not.toHaveBeenCalled();
  });

  it("returns 502 when Claude client throws (e.g., schema parse error)", async () => {
    const claudeClient: ClaudeClient = {
      ask: vi.fn().mockRejectedValue(new Error("Claude response is not valid JSON")),
    };
    const handler = createAskHandler({
      corpus,
      claudeClient,
      defaultModel: "claude-sonnet-4-6",
    });

    const res = await handler(reqWithBody({ question: "Q" }));
    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.error).toBe("llm_error");
  });

  it("accepts a citation that succeeds verification with whitespace normalization", async () => {
    // Body has half-width space between 過 and d/4; LLM emits full-width space
    const claudeClient = makeClaudeClient({
      answer: {
        answer: "x",
        citations: [
          { article_id: "15.5.4", quote: "箍筋之間距不得超過　d/4", source: "body" }, // 全形 space
        ],
      },
      trace: baseTrace,
    });
    const handler = createAskHandler({
      corpus,
      claudeClient,
      defaultModel: "claude-sonnet-4-6",
    });

    const res = await handler(reqWithBody({ question: "Q" }));
    expect(res.status).toBe(200);
  });
});
