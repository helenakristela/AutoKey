"use client";
import { useState } from "react";
import { api } from "@/lib/api";
type SegResult = {
  dp: (number | null)[];
  segments: string[];
  result: string;
  trace: {
    from: number;
    to: number;
    word: string;
    dp_from: number | null;
    dp_to: number | null;
    cost: number;
  }[];
};
export default function SegmentationPanel() {
  const [input, setInput] = useState("programdinamisinicukupsulit");
  const [result, setResult] = useState<SegResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDp, setShowDp] = useState(false);
  const run = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const res = await api.segment(input.replace(/\s+/g, ""));
      setResult(res);
    } finally {
      setLoading(false);
    }
  };
  return <div className="border border-line rounded-lg bg-panel shadow-sm p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-fog mb-3">Auto-Space (Word Segmentation)</div>
      <div className="flex gap-2 mb-3">
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="tempel string tanpa spasi…" className="flex-1 bg-ink border border-line rounded-md px-3 py-2 text-sm focus:border-mint/60 outline-none" />
        <button onClick={run} disabled={loading} className="px-3 py-2 rounded-md bg-mint/10 border border-mint/40 text-mint text-sm hover:bg-mint/20 transition-colors">
          {loading ? "…" : "Segment"}
        </button>
      </div>
      {result && <div className="space-y-3">
          <div className="text-lg text-teal fade-in">{result.result}</div>
          <div>
            <button onClick={() => setShowDp(v => !v)} className="text-[11px] text-fog hover:text-mint underline decoration-dotted">
              {showDp ? "sembunyikan" : "tampilkan"} array dp[] dan trace-back
            </button>
          </div>
          {showDp && <div className="fade-in space-y-3">
              <div>
                <div className="text-[11px] text-fog mb-1">dp[] (biaya minimum sampai indeks i)</div>
                <div className="flex flex-wrap gap-1 text-[11px]">
                  {result.dp.map((v, i) => <div key={i} className="border border-line rounded px-1.5 py-1 min-w-[38px] text-center" title={`dp[${i}]`}>
                      <div className="text-fog text-[9px]">{i}</div>
                      <div className={v === null ? "text-rust" : "text-fog"}>
                        {v === null ? "∞" : v.toFixed(2)}
                      </div>
                    </div>)}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-fog mb-1">trace-back (rekonstruksi mundur)</div>
                <table className="w-full text-[11px] border-collapse">
                  <thead>
                    <tr className="text-fog text-left border-b border-line">
                      <th className="py-1 pr-2">segmen</th>
                      <th className="py-1 pr-2">[j,i)</th>
                      <th className="py-1 pr-2">cost(w)</th>
                      <th className="py-1 pr-2">dp[j] → dp[i]</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.trace.map((t, i) => <tr key={i} className="border-b border-line/50">
                        <td className="py-1 pr-2 text-mint">{t.word}</td>
                        <td className="py-1 pr-2 text-fog">
                          [{t.from},{t.to})
                        </td>
                        <td className="py-1 pr-2">{t.cost}</td>
                        <td className="py-1 pr-2 text-fog">
                          {t.dp_from ?? "0"} → {t.dp_to ?? "∞"}
                        </td>
                      </tr>)}
                  </tbody>
                </table>
              </div>
            </div>}
        </div>}
    </div>;
}
