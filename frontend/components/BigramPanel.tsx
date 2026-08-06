"use client";
import { api } from "@/lib/api";
export default function BigramPanel({
  enabled,
  setEnabled,
  count
}: {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  count: number;
}) {
  const toggle = async () => {
    const next = !enabled;
    setEnabled(next);
    try {
      await api.bigramToggle(next);
    } catch {}
  };
  return <div className="border border-line rounded-lg bg-panel shadow-sm p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-plum mb-3">
        Bigram Language Model
      </div>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-fog">reranking kontekstual</div>
          <div className="text-[11px] text-fog/70">pasangan tercatat sesi ini: {count}</div>
        </div>
        <button onClick={toggle} className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? "bg-violet" : "bg-line"}`}>
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-ink transition-transform ${enabled ? "translate-x-5" : ""}`} />
        </button>
      </div>
    </div>;
}
