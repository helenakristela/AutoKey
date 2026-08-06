"use client";
import { useState } from "react";
import { api } from "@/lib/api";
export default function SmartTrimPanel() {
  const [input, setInput] = useState("saya sedang belajar algoritma dinamis di laboratorium");
  const [limit, setLimit] = useState(30);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const run = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const res = await api.smartTrim(input, limit);
      setResult(res);
    } finally {
      setLoading(false);
    }
  };
  return <div className="border border-line rounded-lg bg-panel shadow-sm p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-plum mb-3">Smart Trim (0/1 Knapsack)</div>
      <textarea value={input} onChange={e => setInput(e.target.value)} rows={2} className="w-full bg-ink border border-line rounded-md px-3 py-2 text-sm focus:border-plum/60 outline-none mb-2" />
      <div className="flex items-center gap-3 mb-3">
        <label className="text-xs text-fog">batas karakter</label>
        <input type="number" value={limit} onChange={e => setLimit(parseInt(e.target.value) || 0)} className="w-20 bg-ink border border-line rounded-md px-2 py-1 text-sm" />
        <button onClick={run} disabled={loading} className="ml-auto px-3 py-1.5 rounded-md bg-plum/15 border border-plum/50 text-fog text-sm hover:bg-plum/25 transition-colors">
          {loading ? "…" : "Trim"}
        </button>
      </div>
      {result && <div className="fade-in space-y-2">
          <div className="text-sm">
            <span className="text-violet font-medium">{result.result}</span>
            <span className="text-fog text-xs ml-2">
              ({result.result_length}/{result.char_limit} karakter)
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {result.words.map((w: string, i: number) => <span key={i} className={`text-[11px] px-2 py-1 rounded border ${result.kept_indices.includes(i) ? "border-plum/60 text-violet bg-plum/10" : "border-line text-fog line-through"}`} title={`weight=${result.weights[i]}, value=${result.values[i]}`}>
                {w}
              </span>)}
          </div>
          <div className="text-[11px] text-fog">total value terpakai: {result.max_value}</div>
        </div>}
    </div>;
}
