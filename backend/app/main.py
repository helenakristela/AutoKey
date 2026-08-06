from __future__ import annotations
import json
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from .trie import Trie
from .levenshtein import find_similar_words_trie as find_similar_words, edit_distance_table
from .segmentation import segment
from .knapsack import smart_trim
from .bigram import BigramModel
app = FastAPI(title='AutoKey API')
app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_methods=['*'], allow_headers=['*'])
DATA_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'kamus.json')
trie = Trie()
total_freq = 0
bigram_model = BigramModel()

@app.on_event('startup')
def load_kamus():
    global total_freq
    with open(DATA_PATH, 'r', encoding='utf-8') as f:
        kamus: dict[str, int] = json.load(f)
    for word, freq in kamus.items():
        trie.insert(word, freq)
        total_freq += freq
    print(f'[AutoKey] Loaded {trie.word_count} kata, total_freq={total_freq}')

class AddWordBody(BaseModel):
    word: str
    freq: int = 1

class CheckAllBody(BaseModel):
    text: str

class SegmentBody(BaseModel):
    text: str

class SmartTrimBody(BaseModel):
    text: str
    char_limit: int

class BigramRecordBody(BaseModel):
    prev: str
    curr: str

class BigramToggleBody(BaseModel):
    enabled: bool

@app.get('/api/stats')
def get_stats():
    return {**trie.stats(), 'total_freq': total_freq}

@app.get('/api/autocomplete')
def autocomplete(prefix: str, top_n: int=5, prev: str | None=None):
    if not prefix or not trie.starts_with(prefix):
        return {'suggestions': []}
    raw = trie.get_suggestions(prefix, top_n=max(top_n, 20))
    reranked = bigram_model.rerank(prev, raw)[:top_n]
    return {'suggestions': [{'word': w, 'freq': f} for w, f in reranked], 'bigram_applied': bool(prev) and bigram_model.enabled and (bigram_model.prev_totals.get((prev or '').lower(), 0) > 0)}

@app.get('/api/spellcheck')
def spellcheck(word: str, top_n: int=5):
    valid = trie.search(word)
    suggestions = [] if valid else find_similar_words(word, trie, max_distance=2, limit=top_n)
    return {'word': word, 'valid': valid, 'suggestions': suggestions}

@app.get('/api/edit-distance-table')
def edit_distance_table_endpoint(s: str, t: str):
    table = edit_distance_table(s.lower(), t.lower())
    return {'s': s, 't': t, 'table': table, 'distance': table[len(s)][len(t)]}

@app.post('/api/check-all')
def check_all(body: CheckAllBody):
    import re
    tokens = re.findall("[a-zA-Z']+|[^a-zA-Z'\\s]", body.text)
    results = []
    idx = 0
    for tok in tokens:
        if tok.isalpha():
            valid = trie.search(tok)
            entry = {'word': tok, 'index': idx, 'valid': valid}
            if not valid:
                entry['suggestions'] = find_similar_words(tok, trie, max_distance=2, limit=5)
            results.append(entry)
        idx += len(tok)
    return {'results': results}

@app.post('/api/add-word')
def add_word(body: AddWordBody):
    global total_freq
    was_new = not trie.search(body.word)
    trie.insert(body.word, body.freq)
    if was_new:
        total_freq += body.freq
    return {'ok': True, 'word': body.word, 'stats': {**trie.stats(), 'total_freq': total_freq}}

@app.post('/api/segment')
def segment_endpoint(body: SegmentBody):
    return segment(body.text, trie, total_freq)

@app.post('/api/smart-trim')
def smart_trim_endpoint(body: SmartTrimBody):
    return smart_trim(body.text, body.char_limit, trie, total_freq)

@app.post('/api/bigram/record')
def bigram_record(body: BigramRecordBody):
    if trie.search(body.prev) and trie.search(body.curr):
        bigram_model.record(body.prev, body.curr)
    return bigram_model.stats()

@app.post('/api/bigram/toggle')
def bigram_toggle(body: BigramToggleBody):
    bigram_model.set_enabled(body.enabled)
    return bigram_model.stats()

@app.get('/api/bigram/stats')
def bigram_stats():
    return bigram_model.stats()

@app.get('/api/health')
def health():
    return {'ok': True}
