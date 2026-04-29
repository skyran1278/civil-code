import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AskPage } from "@/app/components/AskPage";
import type { Article } from "@/lib/corpus-types";

const article: Article = {
  id: "15.5.4",
  chapter: "第十五章",
  section: "15.5",
  subsection: "15.5.4 箍筋",
  body: "箍筋之間距不得超過 d/4。",
  commentary: null,
  tables: [],
  reviewed: false,
};

function mockFetchSequence(responses: Array<{ status: number; body: unknown }>) {
  let i = 0;
  return vi.fn(async () => {
    const r = responses[i++] ?? responses[responses.length - 1];
    return new Response(JSON.stringify(r.body), {
      status: r.status,
      headers: { "content-type": "application/json" },
    });
  });
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AskPage", () => {
  it("submits a question, fetches /api/ask, and renders the answer", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchSequence([
        {
          status: 200,
          body: {
            answer: "箍筋之間距不得超過 d/4",
            citations: [
              {
                article_id: "15.5.4",
                quote: "箍筋之間距不得超過 d/4",
                source: "body",
                verified: true,
              },
            ],
            trace: { model: "claude-sonnet-4-6", cache_hit: true, input_tokens: 100, output_tokens: 20, latency_ms: 1234 },
          },
        },
      ])
    );

    render(<AskPage />);
    await userEvent.type(screen.getByRole("textbox"), "箍筋最大間距?");
    await userEvent.click(screen.getByRole("button", { name: /送出/ }));

    await waitFor(() => {
      expect(screen.getAllByText(/箍筋之間距不得超過 d\/4/).length).toBeGreaterThan(0);
    });
    const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>;
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/ask",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("箍筋最大間距"),
      })
    );
  });

  it("opens the article viewer when a citation article id is clicked", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchSequence([
        {
          status: 200,
          body: {
            answer: "箍筋之間距不得超過 d/4",
            citations: [
              {
                article_id: "15.5.4",
                quote: "箍筋之間距不得超過 d/4",
                source: "body",
                verified: true,
              },
            ],
            trace: {},
          },
        },
        { status: 200, body: article },
      ])
    );

    render(<AskPage />);
    await userEvent.type(screen.getByRole("textbox"), "Q");
    await userEvent.click(screen.getByRole("button", { name: /送出/ }));
    await waitFor(() => screen.getByRole("button", { name: /15\.5\.4/ }));
    await userEvent.click(screen.getByRole("button", { name: /15\.5\.4/ }));

    await waitFor(() => {
      expect(screen.getByText(/15\.5\.4 箍筋/)).toBeInTheDocument();
    });
    const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>;
    expect(fetchMock).toHaveBeenLastCalledWith("/api/articles/15.5.4");
  });

  it("renders citation_failure error when API returns 422", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchSequence([
        {
          status: 422,
          body: {
            error: "citation_verification_failed",
            details: [{ article_id: "x", quote: "y", source: "body", reason: "quote_not_found" }],
            trace: {},
          },
        },
      ])
    );

    render(<AskPage />);
    await userEvent.type(screen.getByRole("textbox"), "Q");
    await userEvent.click(screen.getByRole("button", { name: /送出/ }));

    await waitFor(() => {
      expect(screen.getByText(/系統未能取得可靠答案/)).toBeInTheDocument();
    });
  });

  it("renders llm_error when API returns 502", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchSequence([
        { status: 502, body: { error: "llm_error", message: "boom" } },
      ])
    );

    render(<AskPage />);
    await userEvent.type(screen.getByRole("textbox"), "Q");
    await userEvent.click(screen.getByRole("button", { name: /送出/ }));

    await waitFor(() => {
      expect(screen.getByText("呼叫 LLM 失敗")).toBeInTheDocument();
    });
    expect(screen.getByText("boom")).toBeInTheDocument();
  });

  it("sends the selected model in the request body", async () => {
    const fetchMock = mockFetchSequence([
      {
        status: 200,
        body: { answer: "規範中未明訂", citations: [], trace: {} },
      },
    ]);
    vi.stubGlobal("fetch", fetchMock);

    render(<AskPage />);
    await userEvent.selectOptions(screen.getByRole("combobox"), "claude-opus-4-7");
    await userEvent.type(screen.getByRole("textbox"), "Q");
    await userEvent.click(screen.getByRole("button", { name: /送出/ }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });
    const calls = fetchMock.mock.calls as unknown as Array<[string, RequestInit]>;
    const init = calls[0][1];
    expect(init.body).toContain("claude-opus-4-7");
  });
});
