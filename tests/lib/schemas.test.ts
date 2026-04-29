import { describe, it, expect } from "vitest";
import { llmAnswerSchema } from "@/lib/schemas";

describe("llmAnswerSchema", () => {
  it("parses a valid LLM response", () => {
    const valid = {
      answer: "耐震彎曲構材之箍筋最大間距取以下小者",
      citations: [
        {
          article_id: "15.5.4",
          quote: "箍筋之間距不得超過 d/4",
          source: "body",
        },
      ],
    };
    const parsed = llmAnswerSchema.parse(valid);
    expect(parsed).toEqual(valid);
  });

  it("accepts an empty citations array", () => {
    const valid = { answer: "規範中未明訂", citations: [] };
    expect(llmAnswerSchema.parse(valid)).toEqual(valid);
  });

  it("rejects missing answer field", () => {
    expect(() => llmAnswerSchema.parse({ citations: [] })).toThrow();
  });

  it("rejects missing citations field", () => {
    expect(() => llmAnswerSchema.parse({ answer: "x" })).toThrow();
  });

  it("rejects invalid source enum", () => {
    const invalid = {
      answer: "x",
      citations: [{ article_id: "1.1", quote: "y", source: "footnote" }],
    };
    expect(() => llmAnswerSchema.parse(invalid)).toThrow();
  });

  it("rejects extra unknown fields strictly", () => {
    const withExtra = {
      answer: "x",
      citations: [],
      hallucinated_field: "should not be here",
    };
    // We want strict to surface LLM going off-script
    expect(() => llmAnswerSchema.parse(withExtra)).toThrow();
  });
});
