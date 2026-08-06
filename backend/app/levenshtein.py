from __future__ import annotations
from .trie import Trie

def edit_distance_table(s: str, t: str) -> list[list[int]]:
    n, m = (len(s), len(t))
    dp = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(n + 1):
        dp[i][0] = i
    for j in range(m + 1):
        dp[0][j] = j
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            cost = 0 if s[i - 1] == t[j - 1] else 1
            dp[i][j] = min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
    return dp

def edit_distance(s: str, t: str) -> int:
    return edit_distance_table(s, t)[len(s)][len(t)]

def edit_distance_bounded(s: str, t: str, max_dist: int) -> int | None:
    if abs(len(s) - len(t)) > max_dist:
        return None
    d = edit_distance(s, t)
    return d if d <= max_dist else None

def find_similar_words(word: str, trie: Trie, max_distance: int=2, limit: int=5) -> list[dict]:
    word = word.lower()
    candidates: list[tuple[int, int, str]] = []
    for w, freq in trie.all_words():
        d = edit_distance_bounded(word, w, max_distance)
        if d is not None:
            candidates.append((d, -freq, w))
    candidates.sort(key=lambda x: (x[0], x[1], x[2]))
    return [{'word': w, 'distance': d, 'freq': -negfreq} for d, negfreq, w in candidates[:limit]]

def find_similar_words_trie(word: str, trie: Trie, max_distance: int=2, limit: int=5) -> list[dict]:
    word = word.lower()
    n = len(word)
    results: list[tuple[int, int, str]] = []
    first_row = list(range(n + 1))

    def dfs(node, ch: str, prev_row: list[int], path: str):
        row = [prev_row[0] + 1]
        for j in range(1, n + 1):
            cost = 0 if word[j - 1] == ch else 1
            row.append(min(prev_row[j] + 1, row[j - 1] + 1, prev_row[j - 1] + cost))
        if row[n] <= max_distance and node.is_end:
            results.append((row[n], -node.freq, path))
        if min(row) <= max_distance:
            for next_ch, child in node.children.items():
                dfs(child, next_ch, row, path + next_ch)
    for ch, child in trie.root.children.items():
        dfs(child, ch, first_row, ch)
    results.sort(key=lambda x: (x[0], x[1], x[2]))
    return [{'word': w, 'distance': d, 'freq': -negfreq} for d, negfreq, w in results[:limit]]
