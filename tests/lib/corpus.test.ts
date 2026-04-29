import { describe, it, expect } from "vitest";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadCorpus, getArticleById } from "@/lib/corpus";

const validJson = {
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
      chapter: "第三章",
      section: "3.7",
      subsection: "3.7.5 鋼筋之最小用量",
      body: "撓曲構材任一斷面之拉力主筋斷面積……",
      commentary: null,
      tables: [],
      reviewed: false,
    },
  ],
};

function writeTempJson(content: unknown): string {
  const dir = mkdtempSync(join(tmpdir(), "corpus-test-"));
  const filePath = join(dir, "corpus.json");
  writeFileSync(filePath, JSON.stringify(content));
  return filePath;
}

describe("loadCorpus", () => {
  it("loads and parses a valid corpus JSON file", async () => {
    const path = writeTempJson(validJson);
    const corpus = await loadCorpus(path);
    expect(corpus.meta.law_id).toBe("GL000236");
    expect(corpus.articles).toHaveLength(1);
    expect(corpus.articles[0].id).toBe("3.7.5");
  });

  it("throws when the file does not exist", async () => {
    await expect(loadCorpus("/nonexistent/path.json")).rejects.toThrow();
  });

  it("throws when the JSON is malformed", async () => {
    const dir = mkdtempSync(join(tmpdir(), "corpus-test-"));
    const filePath = join(dir, "bad.json");
    writeFileSync(filePath, "{ not valid json");
    await expect(loadCorpus(filePath)).rejects.toThrow();
  });

  it("throws when the schema is invalid (missing meta)", async () => {
    const path = writeTempJson({ articles: [] });
    await expect(loadCorpus(path)).rejects.toThrow();
  });

  it("throws when an article has missing required fields", async () => {
    const broken = {
      ...validJson,
      articles: [{ id: "1.1" }], // missing body, etc.
    };
    const path = writeTempJson(broken);
    await expect(loadCorpus(path)).rejects.toThrow();
  });
});

describe("getArticleById", () => {
  it("returns the article when found", async () => {
    const path = writeTempJson(validJson);
    const corpus = await loadCorpus(path);
    const article = getArticleById(corpus, "3.7.5");
    expect(article).not.toBeNull();
    expect(article?.id).toBe("3.7.5");
  });

  it("returns null when the article is not found", async () => {
    const path = writeTempJson(validJson);
    const corpus = await loadCorpus(path);
    expect(getArticleById(corpus, "99.9.9")).toBeNull();
  });
});
