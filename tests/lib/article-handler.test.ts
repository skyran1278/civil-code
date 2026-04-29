import { describe, it, expect } from "vitest";
import { createArticleHandler } from "@/lib/article-handler";
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

describe("createArticleHandler", () => {
  it("returns 200 and the article JSON when id exists", async () => {
    const handler = createArticleHandler({ corpus });
    const res = await handler("3.7.5");
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ id: "3.7.5" });
  });

  it("returns 404 when id does not exist", async () => {
    const handler = createArticleHandler({ corpus });
    const res = await handler("99.9.9");
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("not_found");
  });
});
