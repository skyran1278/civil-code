"use client";

import { useState, type FormEvent } from "react";

export interface AskFormProps {
  onSubmit: (question: string) => void;
  loading: boolean;
}

export function AskForm({ onSubmit, loading }: AskFormProps) {
  const [value, setValue] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        placeholder="例：耐震梁箍筋最大間距規定？"
        className="w-full rounded-md border border-slate-300 p-3 text-sm focus:border-blue-500 focus:outline-none"
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading}
        className="self-end rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {loading ? "處理中…" : "送出"}
      </button>
    </form>
  );
}
