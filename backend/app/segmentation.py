from __future__ import annotations
import math
from .trie import Trie
INF = float('inf')

def word_cost(word: str, trie: Trie, total_freq: int) -> float:
    freq = trie.get_freq(word)
    if freq <= 0:
        freq = 1
    return math.log(total_freq / freq)

def segment(text: str, trie: Trie, total_freq: int, max_word_len: int=25) -> dict:
    s = text.lower()
    n = len(s)
    dp = [INF] * (n + 1)
    choice = [-1] * (n + 1)
    dp[0] = 0.0
    for i in range(1, n + 1):
        lo = max(0, i - max_word_len)
        for j in range(lo, i):
            if dp[j] == INF:
                continue
            w = s[j:i]
            cost = word_cost(w, trie, total_freq)
            candidate = dp[j] + cost
            if candidate < dp[i]:
                dp[i] = candidate
                choice[i] = j
    segments: list[str] = []
    trace: list[dict] = []
    i = n
    while i > 0:
        j = choice[i]
        if j == -1:
            j = i - 1
        word = s[j:i]
        segments.append(word)
        trace.append({'from': j, 'to': i, 'word': word, 'dp_from': None if dp[j] == INF else round(dp[j], 4), 'dp_to': None if dp[i] == INF else round(dp[i], 4), 'cost': round(word_cost(word, trie, total_freq), 4)})
        i = j
    segments.reverse()
    trace.reverse()
    return {'dp': [None if v == INF else round(v, 4) for v in dp], 'choice': choice, 'segments': segments, 'result': ' '.join(segments), 'trace': trace}
