import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CitationCard } from "@/app/components/CitationCard";

describe("CitationCard", () => {
  it("renders article id and quote", () => {
    render(
      <CitationCard
        articleId="15.5.4"
        quote="箍筋之間距不得超過 d/4"
        source="body"
        onSelectArticle={() => {}}
      />
    );
    expect(screen.getByText(/15\.5\.4/)).toBeInTheDocument();
    expect(screen.getByText(/箍筋之間距不得超過 d\/4/)).toBeInTheDocument();
  });

  it("shows a badge indicating the source (body)", () => {
    render(
      <CitationCard
        articleId="15.5.4"
        quote="x"
        source="body"
        onSelectArticle={() => {}}
      />
    );
    expect(screen.getByText("規範")).toBeInTheDocument();
  });

  it("shows a badge indicating the source (commentary)", () => {
    render(
      <CitationCard
        articleId="15.5.4"
        quote="x"
        source="commentary"
        onSelectArticle={() => {}}
      />
    );
    expect(screen.getByText("解說")).toBeInTheDocument();
  });

  it("calls onSelectArticle with article id when the article id is clicked", async () => {
    const onSelect = vi.fn();
    render(
      <CitationCard
        articleId="15.5.4"
        quote="x"
        source="body"
        onSelectArticle={onSelect}
      />
    );
    await userEvent.click(screen.getByRole("button", { name: /15\.5\.4/ }));
    expect(onSelect).toHaveBeenCalledWith("15.5.4");
  });

  it("uses a blockquote element for the quote text", () => {
    const { container } = render(
      <CitationCard
        articleId="15.5.4"
        quote="箍筋之間距不得超過 d/4"
        source="body"
        onSelectArticle={() => {}}
      />
    );
    const blockquote = container.querySelector("blockquote");
    expect(blockquote).not.toBeNull();
    expect(blockquote?.textContent).toContain("箍筋之間距不得超過 d/4");
  });
});
