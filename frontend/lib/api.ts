const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
async function req(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json"
    },
    ...opts
  });
  if (!res.ok) throw new Error(`API error ${res.status} on ${path}`);
  return res.json();
}
export type Suggestion = {
  word: string;
  freq: number;
};
export type SimilarWord = {
  word: string;
  distance: number;
  freq: number;
};
export const api = {
  stats: () => req("/api/stats"),
  autocomplete: (prefix: string, topN = 5, prev?: string) => req(`/api/autocomplete?prefix=${encodeURIComponent(prefix)}&top_n=${topN}${prev ? `&prev=${encodeURIComponent(prev)}` : ""}`) as Promise<{
    suggestions: Suggestion[];
    bigram_applied: boolean;
  }>,
  spellcheck: (word: string) => req(`/api/spellcheck?word=${encodeURIComponent(word)}`) as Promise<{
    word: string;
    valid: boolean;
    suggestions: SimilarWord[];
  }>,
  editDistanceTable: (s: string, t: string) => req(`/api/edit-distance-table?s=${encodeURIComponent(s)}&t=${encodeURIComponent(t)}`),
  checkAll: (text: string) => req("/api/check-all", {
    method: "POST",
    body: JSON.stringify({
      text
    })
  }),
  addWord: (word: string, freq = 1) => req("/api/add-word", {
    method: "POST",
    body: JSON.stringify({
      word,
      freq
    })
  }),
  segment: (text: string) => req("/api/segment", {
    method: "POST",
    body: JSON.stringify({
      text
    })
  }),
  smartTrim: (text: string, char_limit: number) => req("/api/smart-trim", {
    method: "POST",
    body: JSON.stringify({
      text,
      char_limit
    })
  }),
  bigramRecord: (prev: string, curr: string) => req("/api/bigram/record", {
    method: "POST",
    body: JSON.stringify({
      prev,
      curr
    })
  }),
  bigramToggle: (enabled: boolean) => req("/api/bigram/toggle", {
    method: "POST",
    body: JSON.stringify({
      enabled
    })
  }),
  bigramStats: () => req("/api/bigram/stats")
};
