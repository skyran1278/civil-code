import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ArticleViewer } from "@/app/components/ArticleViewer";
import type { Article } from "@/lib/corpus-types";

const article: Article = {
  id: "3.7.5",
  chapter: "第三章 強度與使用性",
  section: "3.7 撓曲與軸力",
  subsection: "3.7.5 鋼筋之最小用量",
  body: "撓曲構材任一斷面之拉力主筋斷面積……",
  commentary: "本條規定旨在確保構材於混凝土開裂後仍有足夠強度。",
  tables: [],
  reviewed: false,
};

describe("ArticleViewer", () => {
  it("renders nothing when article is null", () => {
    const { container } = render(
      <ArticleViewer article={null} loading={false} onClose={() => {}} />
    );
    expect(container.textContent?.trim()).toBe("");
  });

  it("shows loading indicator when loading and article not yet fetched", () => {
    render(<ArticleViewer article={null} loading={true} onClose={() => {}} />);
    expect(screen.getByText(/載入中|loading/i)).toBeInTheDocument();
  });

  it("renders article id, body, and commentary", () => {
    render(<ArticleViewer article={article} loading={false} onClose={() => {}} />);
    expect(screen.getByText(/3\.7\.5/)).toBeInTheDocument();
    expect(screen.getByText(/拉力主筋斷面積/)).toBeInTheDocument();
    expect(screen.getByText(/確保構材於混凝土開裂後/)).toBeInTheDocument();
  });

  it("does not render commentary section when commentary is null", () => {
    render(
      <ArticleViewer
        article={{ ...article, commentary: null }}
        loading={false}
        onClose={() => {}}
      />
    );
    expect(screen.queryByText("【解說】")).not.toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", async () => {
    const onClose = vi.fn();
    render(<ArticleViewer article={article} loading={false} onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: /關閉|close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("highlights the matched quote when highlight prop is provided", () => {
    render(
      <ArticleViewer
        article={article}
        loading={false}
        onClose={() => {}}
        highlight="拉力主筋斷面積"
      />
    );
    const marks = screen.getAllByText("拉力主筋斷面積");
    expect(marks.some((el) => el.tagName === "MARK")).toBe(true);
  });
});
