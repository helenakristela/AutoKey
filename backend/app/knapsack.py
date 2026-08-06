from __future__ import annotations
import math
from .trie import Trie

def smart_trim(text: str, char_limit: int, trie: Trie, total_freq: int) -> dict:
    words = text.split()
    n = len(words)
    weights = [len(w) for w in words]
    values = []
    for w in words:
        freq = trie.get_freq(w.lower())
        if freq <= 0:
            freq = 1
        values.append(math.log(total_freq / freq))
    W = char_limit
    dp = [[0.0] * (W + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        wt = weights[i - 1]
        val = values[i - 1]
        for w in range(W + 1):
            dp[i][w] = dp[i - 1][w]
            if wt <= w:
                candidate = dp[i - 1][w - wt] + val
                if candidate > dp[i][w]:
                    dp[i][w] = candidate
    kept_idx = []
    w = W
    for i in range(n, 0, -1):
        if dp[i][w] != dp[i - 1][w]:
            kept_idx.append(i - 1)
            w -= weights[i - 1]
    kept_idx.reverse()
    kept_words = [words[i] for i in kept_idx]
    result = ' '.join(kept_words)
    return {'original': text, 'char_limit': char_limit, 'kept_indices': kept_idx, 'kept_words': kept_words, 'result': result, 'result_length': len(result), 'max_value': round(dp[n][W], 4), 'words': words, 'weights': weights, 'values': [round(v, 4) for v in values]}
