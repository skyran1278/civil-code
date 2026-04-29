"use client";

import { useState } from "react";
import { AskForm } from "./AskForm";
import { AnswerPanel, type AnswerState } from "./AnswerPanel";
import { ArticleViewer } from "./ArticleViewer";
import { ModelSelector, type SupportedModel } from "./ModelSelector";
import type { Article } from "@/lib/corpus-types";

interface ArticleViewerState {
  article: Article | null;
  loading: boolean;
  highlight?: string;
}

export function AskPage() {
  const [state, setState] = useState<AnswerState>({ kind: "idle" });
  const [model, setModel] = useState<SupportedModel>("claude-sonnet-4-6");
  const [viewer, setViewer] = useState<ArticleViewerState | null>(null);

  async function handleSubmit(question: string) {
    setState({ kind: "loading" });
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question, model }),
      });
      const json = await res.json();

      if (res.status === 200) {
        setState({ kind: "success", answer: json.answer, citations: json.citations });
      } else if (res.status === 422 && json.error === "citation_verification_failed") {
        setState({ kind: "citation_failure", details: json.details ?? [] });
      } else {
        setState({ kind: "llm_error", message: json.message ?? json.error ?? "未知錯誤" });
      }
    } catch (e) {
      setState({ kind: "llm_error", message: (e as Error).message });
    }
  }

  async function handleSelectArticle(articleId: string) {
    let highlight: string | undefined;
    if (state.kind === "success") {
      highlight = state.citations.find((c) => c.article_id === articleId)?.quote;
    }
    setViewer({ article: null, loading: true, highlight });
    try {
      const res = await fetch(`/api/articles/${articleId}`);
      if (!res.ok) {
        setViewer(null);
        return;
      }
      const article = (await res.json()) as Article;
      setViewer({ article, loading: false, highlight });
    } catch {
      setViewer(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <h1 className="text-lg font-semibold">建築物混凝土結構設計規範查詢</h1>
          <ModelSelector value={model} onChange={setModel} />
        </div>
      </header>
      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[1fr_1fr]">
        <section className="space-y-6">
          <AskForm onSubmit={handleSubmit} loading={state.kind === "loading"} />
          <AnswerPanel state={state} onSelectArticle={handleSelectArticle} />
        </section>
        <section>
          {viewer ? (
            <ArticleViewer
              article={viewer.article}
              loading={viewer.loading}
              onClose={() => setViewer(null)}
              highlight={viewer.highlight}
            />
          ) : (
            <p className="text-sm text-slate-400">點擊引用條編號可在這裡開啟條文。</p>
          )}
        </section>
      </main>
    </div>
  );
}
