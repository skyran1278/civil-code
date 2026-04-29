import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnswerPanel } from "@/app/components/AnswerPanel";

describe("AnswerPanel", () => {
  it("renders nothing visible when idle", () => {
    const { container } = render(
      <AnswerPanel state={{ kind: "idle" }} onSelectArticle={() => {}} />
    );
    expect(container.textContent?.trim() ?? "").toBe("");
  });

  it("renders a loading indicator when loading", () => {
    render(<AnswerPanel state={{ kind: "loading" }} onSelectArticle={() => {}} />);
    expect(screen.getByText(/思考中|loading/i)).toBeInTheDocument();
  });

  it("renders answer text and citations on success", () => {
    render(
      <AnswerPanel
        state={{
          kind: "success",
          answer: "箍筋之間距不得超過 d/4",
          citations: [
            {
              article_id: "15.5.4",
              quote: "箍筋之間距不得超過 d/4",
              source: "body",
              verified: true,
            },
          ],
        }}
        onSelectArticle={() => {}}
      />
    );
    expect(screen.getAllByText(/箍筋之間距不得超過 d\/4/).length).toBeGreaterThan(0);
    expect(screen.getByText(/15\.5\.4/)).toBeInTheDocument();
  });

  it("renders the no-citations notice when citations is empty (e.g. 規範中未明訂)", () => {
    render(
      <AnswerPanel
        state={{
          kind: "success",
          answer: "規範中未明訂",
          citations: [],
        }}
        onSelectArticle={() => {}}
      />
    );
    expect(screen.getByText("規範中未明訂")).toBeInTheDocument();
    expect(screen.getByText(/未提供.*引用|無相關.*條文/)).toBeInTheDocument();
  });

  it("renders an error message on citation_verification_failed", () => {
    render(
      <AnswerPanel
        state={{
          kind: "citation_failure",
          details: [{ article_id: "x", quote: "y", source: "body", reason: "quote_not_found" }],
        }}
        onSelectArticle={() => {}}
      />
    );
    expect(screen.getByText(/系統未能取得可靠答案/)).toBeInTheDocument();
  });

  it("renders an error message on llm_error", () => {
    render(
      <AnswerPanel
        state={{ kind: "llm_error", message: "boom" }}
        onSelectArticle={() => {}}
      />
    );
    expect(screen.getByText(/呼叫.*失敗|LLM/i)).toBeInTheDocument();
  });
});
