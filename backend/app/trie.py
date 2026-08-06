from __future__ import annotations
from typing import Optional

class TrieNode:
    __slots__ = ('children', 'is_end', 'freq')

    def __init__(self):
        self.children: dict[str, 'TrieNode'] = {}
        self.is_end: bool = False
        self.freq: int = 0

class Trie:

    def __init__(self):
        self.root = TrieNode()
        self.word_count = 0
        self.node_count = 1

    def insert(self, word: str, freq: int=1) -> None:
        word = word.lower()
        node = self.root
        for ch in word:
            if ch not in node.children:
                node.children[ch] = TrieNode()
                self.node_count += 1
            node = node.children[ch]
        if not node.is_end:
            self.word_count += 1
        node.is_end = True
        node.freq = max(node.freq, freq)

    def search(self, word: str) -> bool:
        node = self._walk(word.lower())
        return node is not None and node.is_end

    def get_freq(self, word: str) -> int:
        node = self._walk(word.lower())
        return node.freq if node and node.is_end else 0

    def starts_with(self, prefix: str) -> bool:
        return self._walk(prefix.lower()) is not None

    def _walk(self, s: str) -> Optional[TrieNode]:
        node = self.root
        for ch in s:
            if ch not in node.children:
                return None
            node = node.children[ch]
        return node

    def get_suggestions(self, prefix: str, top_n: int=5) -> list[tuple[str, int]]:
        prefix = prefix.lower()
        start_node = self._walk(prefix)
        if start_node is None:
            return []
        results: list[tuple[str, int]] = []

        def dfs(node: TrieNode, path: str):
            if node.is_end:
                results.append((path, node.freq))
            for ch, child in node.children.items():
                dfs(child, path + ch)
        dfs(start_node, prefix)
        results.sort(key=lambda x: (-x[1], x[0]))
        return results[:top_n]

    def all_words(self):

        def dfs(node: TrieNode, path: str):
            if node.is_end:
                yield (path, node.freq)
            for ch, child in node.children.items():
                yield from dfs(child, path + ch)
        yield from dfs(self.root, '')

    def average_depth(self) -> float:
        depths = []

        def dfs(node: TrieNode, depth: int):
            if node.is_end:
                depths.append(depth)
            for child in node.children.values():
                dfs(child, depth + 1)
        dfs(self.root, 0)
        return sum(depths) / len(depths) if depths else 0.0

    def estimate_memory_bytes(self, bytes_per_node: int=120) -> int:
        return self.node_count * bytes_per_node

    def stats(self) -> dict:
        return {'word_count': self.word_count, 'node_count': self.node_count, 'average_depth': round(self.average_depth(), 3), 'estimated_memory_bytes': self.estimate_memory_bytes()}
