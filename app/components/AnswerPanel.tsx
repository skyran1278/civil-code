"use client";

import { CitationCard } from "./CitationCard";
import type { CitationSource } from "@/lib/corpus-types";

export interface VerifiedCitation {
  article_id: string;
  quote: string;
  source: CitationSource;
  verified: true;
}

export interface FailedCitationDetail {
  article_id: string;
  quote: string;
  source: CitationSource;
  reason: string;
}

export type AnswerState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; answer: string; citations: VerifiedCitation[] }
  | { kind: "citation_failure"; details: FailedCitationDetail[] }
  | { kind: "llm_error"; message: string };

export interface AnswerPanelProps {
  state: AnswerState;
  onSelectArticle: (articleId: string) => void;
}

export function AnswerPanel({ state, onSelectArticle }: AnswerPanelProps) {
  if (state.kind === "idle") return null;

  if (state.kind === "loading") {
    return <div className="text-slate-500">思考中…</div>;
  }

  if (state.kind === "success") {
    return (
      <div className="space-y-4">
        <section>
          <h2 className="mb-2 text-sm font-semibold text-slate-500">答案</h2>
          <p className="whitespace-pre-wrap leading-relaxed text-slate-900">{state.answer}</p>
        </section>
        <section>
          <h2 className="mb-2 text-sm font-semibold text-slate-500">引用</h2>
          {state.citations.length === 0 ? (
            <p className="text-slate-500">未提供條文引用（無相關條文）</p>
          ) : (
            <div className="space-y-2">
              {state.citations.map((c, i) => (
                <CitationCard
                  key={`${c.article_id}-${i}`}
                  articleId={c.article_id}
                  quote={c.quote}
                  source={c.source}
                  onSelectArticle={onSelectArticle}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  if (state.kind === "citation_failure") {
    return (
      <div className="rounded-md border border-amber-300 bg-amber-50 p-4">
        <p className="font-semibold text-amber-900">系統未能取得可靠答案</p>
        <p className="text-sm text-amber-800">請改問法或縮小範圍。LLM 引用未通過 verbatim 驗證。</p>
        <details className="mt-2 text-xs text-amber-700">
          <summary className="cursor-pointer">debug 細節</summary>
          <pre className="mt-1 whitespace-pre-wrap">{JSON.stringify(state.details, null, 2)}</pre>
        </details>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-red-300 bg-red-50 p-4">
      <p className="font-semibold text-red-900">呼叫 LLM 失敗</p>
      <p className="text-sm text-red-800">{state.message}</p>
    </div>
  );
}
