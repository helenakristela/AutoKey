from __future__ import annotations
from collections import defaultdict

class BigramModel:

    def __init__(self):
        self.pair_counts: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
        self.prev_totals: dict[str, int] = defaultdict(int)
        self.total_pairs_recorded = 0
        self.enabled = True

    def record(self, prev_word: str, curr_word: str) -> None:
        prev_word, curr_word = (prev_word.lower(), curr_word.lower())
        self.pair_counts[prev_word][curr_word] += 1
        self.prev_totals[prev_word] += 1
        self.total_pairs_recorded += 1

    def prob(self, prev_word: str, curr_word: str) -> float:
        prev_word, curr_word = (prev_word.lower(), curr_word.lower())
        total = self.prev_totals.get(prev_word, 0)
        if total == 0:
            return 0.0
        return self.pair_counts[prev_word].get(curr_word, 0) / total

    def rerank(self, prev_word: str | None, candidates: list[tuple[str, int]]) -> list[tuple[str, int]]:
        if not self.enabled or not prev_word:
            return candidates
        prev_word = prev_word.lower()
        if self.prev_totals.get(prev_word, 0) == 0:
            return candidates
        scored = []
        any_match = False
        for word, freq in candidates:
            p = self.prob(prev_word, word)
            if p > 0:
                any_match = True
            scored.append((p * freq, word, freq))
        if not any_match:
            return candidates
        scored.sort(key=lambda x: -x[0])
        return [(w, f) for _, w, f in scored]

    def set_enabled(self, enabled: bool) -> None:
        self.enabled = enabled

    def stats(self) -> dict:
        return {'total_pairs_recorded': self.total_pairs_recorded, 'enabled': self.enabled}
