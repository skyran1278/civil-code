"use client";

export type SupportedModel = "claude-sonnet-4-6" | "claude-opus-4-7";

export interface ModelSelectorProps {
  value: SupportedModel;
  onChange: (model: SupportedModel) => void;
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as SupportedModel)}
      className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
      aria-label="選擇模型"
    >
      <option value="claude-sonnet-4-6">Sonnet 4.6 (預設)</option>
      <option value="claude-opus-4-7">Opus 4.7</option>
    </select>
  );
}
