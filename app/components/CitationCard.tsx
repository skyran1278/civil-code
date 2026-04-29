"use client";

import type { CitationSource } from "@/lib/corpus-types";

export interface CitationCardProps {
  articleId: string;
  quote: string;
  source: CitationSource;
  onSelectArticle: (articleId: string) => void;
}

export function CitationCard({ articleId, quote, source, onSelectArticle }: CitationCardProps) {
  const sourceLabel = source === "body" ? "規範" : "解說";
  return (
    <article className="rounded-md border border-slate-200 bg-white p-3 text-sm shadow-sm">
      <header className="mb-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onSelectArticle(articleId)}
          className="font-mono text-blue-600 hover:underline"
        >
          條 {articleId}
        </button>
        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
          {sourceLabel}
        </span>
      </header>
      <blockquote className="border-l-2 border-slate-300 pl-3 text-slate-800 whitespace-pre-wrap">
        {quote}
      </blockquote>
    </article>
  );
}
