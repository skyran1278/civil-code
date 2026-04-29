import { describe, it, expect } from "vitest";
import { buildSystemPrompt, serializeCorpusToMarkdown } from "@/lib/prompts";
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
      id: "3.7.5",
      chapter: "第三章 強度與使用性",
      section: "3.7 撓曲與軸力",
      subsection: "3.7.5 鋼筋之最小用量",
      body: "撓曲構材任一斷面之拉力主筋斷面積 As 不得少於下列規定值。",
      commentary: "本條規定旨在確保構材於混凝土開裂後仍有足夠強度。",
      tables: [],
      reviewed: false,
    },
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

describe("serializeCorpusToMarkdown", () => {
  it("includes the law name and version in a header", () => {
    const md = serializeCorpusToMarkdown(corpus);
    expect(md).toContain("建築物混凝土結構設計規範");
    expect(md).toContain("112年8月10日修正");
  });

  it("includes every article id and body verbatim", () => {
    const md = serializeCorpusToMarkdown(corpus);
    expect(md).toContain("3.7.5");
    expect(md).toContain("撓曲構材任一斷面之拉力主筋斷面積 As 不得少於下列規定值。");
    expect(md).toContain("15.5.4");
    expect(md).toContain("箍筋之間距不得超過 d/4。");
  });

  it("includes commentary when present", () => {
    const md = serializeCorpusToMarkdown(corpus);
    expect(md).toContain("本條規定旨在確保構材於混凝土開裂後仍有足夠強度。");
  });

  it("omits commentary section for articles without commentary", () => {
    const md = serializeCorpusToMarkdown(corpus);
    // Article 15.5.4 has commentary=null. We should not invent a "解說" header for it.
    const article155 = md.split("15.5.4")[1] ?? "";
    const stop = article155.indexOf("3.7.5");
    const sliced = stop >= 0 ? article155.slice(0, stop) : article155;
    expect(sliced).not.toContain("【解說】");
  });
});

describe("buildSystemPrompt", () => {
  it("includes the serialized corpus", () => {
    const prompt = buildSystemPrompt(corpus);
    expect(prompt).toContain("建築物混凝土結構設計規範");
    expect(prompt).toContain("撓曲構材任一斷面之拉力主筋斷面積 As 不得少於下列規定值。");
  });

  it("instructs the model to only use the provided corpus", () => {
    const prompt = buildSystemPrompt(corpus);
    expect(prompt).toMatch(/不得依靠.*訓練資料|只能根據.*提供.*法規/);
  });

  it("instructs the model to cite verbatim", () => {
    const prompt = buildSystemPrompt(corpus);
    expect(prompt).toMatch(/verbatim|逐字|原文/);
  });

  it("instructs the model to answer 規範中未明訂 when no basis", () => {
    const prompt = buildSystemPrompt(corpus);
    expect(prompt).toContain("規範中未明訂");
  });

  it("describes the required JSON output shape", () => {
    const prompt = buildSystemPrompt(corpus);
    expect(prompt).toContain("answer");
    expect(prompt).toContain("citations");
    expect(prompt).toContain("article_id");
    expect(prompt).toContain("quote");
    expect(prompt).toContain("source");
  });
});
