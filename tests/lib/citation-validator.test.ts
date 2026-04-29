import { describe, it, expect } from "vitest";
import { validateCitation } from "@/lib/citation-validator";
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
  ],
};

describe("validateCitation", () => {
  it("verifies a verbatim quote that appears in article body", () => {
    const result = validateCitation(corpus, {
      article_id: "3.7.5",
      quote: "拉力主筋斷面積 As 不得少於下列規定值",
      source: "body",
    });
    expect(result).toEqual({ verified: true });
  });

  it("rejects a fabricated quote not present in the article", () => {
    const result = validateCitation(corpus, {
      article_id: "3.7.5",
      quote: "鋼筋的最小直徑為 25 mm",
      source: "body",
    });
    expect(result).toEqual({ verified: false, reason: "quote_not_found" });
  });

  it("rejects a citation referencing a nonexistent article", () => {
    const result = validateCitation(corpus, {
      article_id: "99.9.9",
      quote: "anything",
      source: "body",
    });
    expect(result).toEqual({ verified: false, reason: "article_not_found" });
  });

  it("verifies quotes from commentary when source is commentary", () => {
    const result = validateCitation(corpus, {
      article_id: "3.7.5",
      quote: "確保構材於混凝土開裂後仍有足夠強度",
      source: "commentary",
    });
    expect(result).toEqual({ verified: true });
  });

  it("rejects commentary citation when commentary is null", () => {
    const corpusNoCommentary: Corpus = {
      ...corpus,
      articles: [{ ...corpus.articles[0], commentary: null }],
    };
    const result = validateCitation(corpusNoCommentary, {
      article_id: "3.7.5",
      quote: "anything",
      source: "commentary",
    });
    expect(result).toEqual({ verified: false, reason: "commentary_missing" });
  });

  it("normalizes whitespace differences (full-width vs half-width spaces)", () => {
    // Article body uses half-width space; LLM might quote with full-width space
    const result = validateCitation(corpus, {
      article_id: "3.7.5",
      quote: "拉力主筋斷面積　As　不得少於下列規定值", // 全形空白
      source: "body",
    });
    expect(result).toEqual({ verified: true });
  });

  it("normalizes collapsed whitespace differences", () => {
    // LLM might collapse multiple spaces into one or vice versa
    const result = validateCitation(corpus, {
      article_id: "3.7.5",
      quote: "拉力主筋斷面積  As  不得少於下列規定值", // double spaces
      source: "body",
    });
    expect(result).toEqual({ verified: true });
  });
});
