"use client";

import type { Article } from "@/lib/corpus-types";

export interface ArticleViewerProps {
  article: Article | null;
  loading: boolean;
  onClose: () => void;
  highlight?: string;
}

function HighlightedText({ text, highlight }: { text: string; highlight?: string }) {
  if (!highlight || !text.includes(highlight)) {
    return <>{text}</>;
  }
  const parts = text.split(highlight);
  return (
    <>
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && (
            <mark className="bg-yellow-200 px-0.5">{highlight}</mark>
          )}
        </span>
      ))}
    </>
  );
}

export function ArticleViewer({ article, loading, onClose, highlight }: ArticleViewerProps) {
  if (!article && !loading) return null;

  return (
    <aside className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-500">條文閱覽器</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="關閉"
        >
          ✕
        </button>
      </div>
      {loading && !article ? (
        <p className="text-slate-500">載入中…</p>
      ) : article ? (
        <article className="space-y-3 text-sm">
          <header>
            <p className="text-xs text-slate-500">{article.chapter} / {article.section}</p>
            <h3 className="text-base font-semibold text-slate-900">
              條 {article.id} — {article.subsection}
            </h3>
          </header>
          <section>
            <p className="text-xs font-semibold text-slate-500">【規範本文】</p>
            <p className="whitespace-pre-wrap leading-relaxed text-slate-900">
              <HighlightedText text={article.body} highlight={highlight} />
            </p>
          </section>
          {article.commentary && (
            <section>
              <p className="text-xs font-semibold text-slate-500">【解說】</p>
              <p className="whitespace-pre-wrap leading-relaxed text-slate-700">
                <HighlightedText text={article.commentary} highlight={highlight} />
              </p>
            </section>
          )}
        </article>
      ) : null}
    </aside>
  );
}
