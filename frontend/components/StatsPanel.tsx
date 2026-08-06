"use client";
type Stats = {
  word_count: number;
  node_count: number;
  average_depth: number;
  estimated_memory_bytes: number;
  total_freq: number;
};
function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}
export default function StatsPanel({
  stats
}: {
  stats: Stats | null;
}) {
  const rows = stats ? [{
    label: "Kata ter-insert",
    value: stats.word_count.toLocaleString("id-ID")
  }, {
    label: "Jumlah node",
    value: stats.node_count.toLocaleString("id-ID")
  }, {
    label: "Kedalaman rata-rata",
    value: stats.average_depth.toFixed(2)
  }, {
    label: "Estimasi memory",
    value: formatBytes(stats.estimated_memory_bytes)
  }] : [];
  return <div className="trie-rule pl-4 py-3">
      <div className="text-xs uppercase tracking-[0.18em] text-fog mb-3">Statistik Trie</div>
      {!stats ? <div className="text-fog text-sm">memuat kamus…</div> : <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {rows.map(r => <div key={r.label}>
              <div className="text-[11px] text-fog">{r.label}</div>
              <div className="text-lg font-semibold text-mint">{r.value}</div>
            </div>)}
        </div>}
    </div>;
}
