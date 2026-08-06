"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, Suggestion, SimilarWord } from "@/lib/api";
import { getCaretCharOffset, setCaretCharOffset, getCurrentWord } from "@/lib/caret";
const WORD_RE = /[a-zA-Z']+/g;
function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
export default function Editor({
  bigramEnabled,
  onBigramCountChange
}: {
  bigramEnabled: boolean;
  onBigramCountChange: (n: number) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const validityCache = useRef<Map<string, boolean>>(new Map());
  const lastCompletedWord = useRef<string | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({
    top: 0,
    left: 0
  });
  const [activeIndex, setActiveIndex] = useState(0);
  const [bigramApplied, setBigramApplied] = useState(false);
  const [clickedWord, setClickedWord] = useState<{
    word: string;
    start: number;
    top: number;
    left: number;
  } | null>(null);
  const [clickedSuggestions, setClickedSuggestions] = useState<SimilarWord[]>([]);
  const rerenderHighlights = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const text = el.innerText;
    const caret = getCaretCharOffset(el);
    let html = "";
    let last = 0;
    let m: RegExpExecArray | null;
    WORD_RE.lastIndex = 0;
    while (m = WORD_RE.exec(text)) {
      const word = m[0];
      html += escapeHtml(text.slice(last, m.index));
      const valid = validityCache.current.get(word.toLowerCase());
      if (valid === false) {
        html += `<span class="misspelled" data-word="${escapeHtml(word)}" data-start="${m.index}">${escapeHtml(word)}</span>`;
      } else {
        html += escapeHtml(word);
      }
      last = m.index + word.length;
    }
    html += escapeHtml(text.slice(last));
    el.innerHTML = html || "<br/>";
    setCaretCharOffset(el, caret);
  }, []);
  const checkWordsAndHighlight = useCallback(async (words: string[]) => {
    const toCheck = [...new Set(words.map(w => w.toLowerCase()))].filter(w => !validityCache.current.has(w));
    await Promise.all(toCheck.map(async w => {
      try {
        const res = await api.spellcheck(w);
        validityCache.current.set(w, res.valid);
      } catch {}
    }));
    rerenderHighlights();
  }, [rerenderHighlights]);
  const updateDropdownPosition = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !wrapperRef.current) return;
    const range = sel.getRangeAt(0).cloneRange();
    range.collapse(true);
    const rect = range.getClientRects()[0] || (range.startContainer as any)?.getBoundingClientRect?.();
    const wrapperRect = wrapperRef.current.getBoundingClientRect();
    if (rect) {
      setDropdownPos({
        top: rect.bottom - wrapperRect.top + 6,
        left: rect.left - wrapperRect.left
      });
    }
  };
  const handleInput = async () => {
    const el = editorRef.current;
    if (!el) return;
    const text = el.innerText;
    const caret = getCaretCharOffset(el);
    const {
      word
    } = getCurrentWord(text, caret);
    if (word.length > 0) {
      updateDropdownPosition();
      try {
        const res = await api.autocomplete(word, 5, bigramEnabled ? lastCompletedWord.current || undefined : undefined);
        setSuggestions(res.suggestions);
        setBigramApplied(res.bigram_applied);
        setShowDropdown(res.suggestions.length > 0);
        setActiveIndex(0);
      } catch {
        setShowDropdown(false);
      }
    } else {
      setShowDropdown(false);
    }
    const charBeforeCaret = text[caret - 1];
    if (charBeforeCaret && /[\s.,!?;:]/.test(charBeforeCaret)) {
      let end = caret - 1;
      let start = end;
      while (start > 0 && /[a-zA-Z']/.test(text[start - 1])) start--;
      const finishedWord = text.slice(start, end);
      if (finishedWord) {
        const prevWord = lastCompletedWord.current;
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        checkWordsAndHighlight([finishedWord]);
        if (prevWord) {
          api.bigramRecord(prevWord, finishedWord).then(s => onBigramCountChange(s.total_pairs_recorded)).catch(() => {});
        }
        lastCompletedWord.current = finishedWord;
      }
    }
  };
  const insertCompletion = (word: string) => {
    const el = editorRef.current;
    if (!el) return;
    const text = el.innerText;
    const caret = getCaretCharOffset(el);
    const {
      start
    } = getCurrentWord(text, caret);
    const newText = text.slice(0, start) + word + " " + text.slice(caret);
    el.innerText = newText;
    setCaretCharOffset(el, start + word.length + 1);
    setShowDropdown(false);
    lastCompletedWord.current = word;
    checkWordsAndHighlight([word]);
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showDropdown && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex(i => (i + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex(i => (i - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === "Tab" || e.key === "Enter") {
        e.preventDefault();
        insertCompletion(suggestions[activeIndex].word);
        return;
      }
      if (e.key === "Escape") {
        setShowDropdown(false);
        return;
      }
    }
  };
  const handleEditorClick = async (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains("misspelled")) {
      const word = target.getAttribute("data-word") || "";
      const start = parseInt(target.getAttribute("data-start") || "0", 10);
      const rect = target.getBoundingClientRect();
      const wrapperRect = wrapperRef.current?.getBoundingClientRect();
      setClickedWord({
        word,
        start,
        top: rect.bottom - (wrapperRect?.top || 0) + 6,
        left: rect.left - (wrapperRect?.left || 0)
      });
      try {
        const res = await api.spellcheck(word);
        setClickedSuggestions(res.suggestions);
      } catch {
        setClickedSuggestions([]);
      }
      setShowDropdown(false);
    } else {
      setClickedWord(null);
    }
  };
  const replaceClickedWord = (replacement: string) => {
    const el = editorRef.current;
    if (!el || !clickedWord) return;
    const text = el.innerText;
    const {
      word,
      start
    } = clickedWord;
    const newText = text.slice(0, start) + replacement + text.slice(start + word.length);
    el.innerText = newText;
    validityCache.current.delete(word.toLowerCase());
    setClickedWord(null);
    rerenderHighlights();
  };
  const addToDictionary = async () => {
    if (!clickedWord) return;
    await api.addWord(clickedWord.word, 1);
    validityCache.current.set(clickedWord.word.toLowerCase(), true);
    setClickedWord(null);
    rerenderHighlights();
  };
  const [checkAllResults, setCheckAllResults] = useState<{
    word: string;
    index: number;
    valid: boolean;
    suggestions?: SimilarWord[];
  }[] | null>(null);
  const [checkAllLoading, setCheckAllLoading] = useState(false);
  const runCheckAll = async () => {
    const el = editorRef.current;
    if (!el) return;
    setCheckAllLoading(true);
    try {
      const res = await api.checkAll(el.innerText);
      setCheckAllResults(res.results.filter((r: any) => !r.valid));
      for (const r of res.results) {
        validityCache.current.set(r.word.toLowerCase(), r.valid);
      }
      rerenderHighlights();
    } finally {
      setCheckAllLoading(false);
    }
  };
  const [pasteHint, setPasteHint] = useState(false);
  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text");
    if (text && !/\s/.test(text.trim()) && text.trim().length > 12) {
      setPasteHint(true);
      setTimeout(() => setPasteHint(false), 4000);
    }
  };
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setClickedWord(null);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);
  return <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs uppercase tracking-[0.18em] text-fog">Editor</div>
        <div className="flex items-center gap-2">
          {bigramEnabled && bigramApplied && <span className="text-[10px] px-2 py-0.5 rounded-full bg-mint/10 text-mint">
              bigram aktif
            </span>}
          <button onClick={runCheckAll} disabled={checkAllLoading} className="text-xs px-3 py-1.5 rounded-md bg-panel border border-line hover:border-mint/60 text-fog hover:text-mint transition-colors">
            {checkAllLoading ? "Memeriksa…" : "Check All"}
          </button>
        </div>
      </div>
      <div ref={wrapperRef} className="relative flex-1">
        {pasteHint && <div className="absolute -top-8 left-0 text-[11px] text-teal fade-in">
            teks tanpa spasi terdeteksi, coba fitur Auto-Space di panel kanan
          </div>}
        <div ref={editorRef} contentEditable suppressContentEditableWarning spellCheck={false} onInput={handleInput} onKeyDown={handleKeyDown} onClick={handleEditorClick} onPaste={handlePaste} className="editor-area text-[15px] leading-relaxed bg-panel border border-line rounded-lg p-4 min-h-[280px] shadow-sm focus:border-mint/60 transition-colors" data-placeholder="Mulai mengetik di sini…" />
        {showDropdown && suggestions.length > 0 && <ul className="absolute z-20 bg-panel border border-line rounded-md shadow-xl text-sm overflow-hidden fade-in" style={{
        top: dropdownPos.top,
        left: dropdownPos.left,
        minWidth: 160
      }}>
            {suggestions.map((s, i) => <li key={s.word} onMouseDown={e => {
          e.preventDefault();
          insertCompletion(s.word);
        }} className={`px-3 py-1.5 cursor-pointer flex justify-between gap-4 ${i === activeIndex ? "bg-mint/15 text-mint" : "hover:bg-line/60"}`}>
                <span>{s.word}</span>
                <span className="text-fog text-xs">{s.freq}</span>
              </li>)}
          </ul>}
        {clickedWord && <div className="absolute z-20 bg-panel border border-line rounded-md shadow-xl text-sm overflow-hidden fade-in" style={{
        top: clickedWord.top,
        left: clickedWord.left,
        minWidth: 180
      }}>
            {clickedSuggestions.length === 0 ? <div className="px-3 py-2 text-fog text-xs">tidak ada saran</div> : clickedSuggestions.map(s => <div key={s.word} onMouseDown={e => {
          e.preventDefault();
          replaceClickedWord(s.word);
        }} className="px-3 py-1.5 cursor-pointer hover:bg-line/60 flex justify-between gap-4">
                  <span>{s.word}</span>
                  <span className="text-fog text-xs">d={s.distance}</span>
                </div>)}
            <div onMouseDown={e => {
          e.preventDefault();
          addToDictionary();
        }} className="px-3 py-1.5 cursor-pointer hover:bg-teal/10 text-teal border-t border-line text-xs">
              + Tambah ke kamus
            </div>
          </div>}
      </div>
      {checkAllResults && <div className="mt-4 border border-line rounded-lg bg-panel p-3 max-h-48 overflow-auto scrollbar-thin">
          <div className="text-xs uppercase tracking-[0.18em] text-fog mb-2">
            Hasil Check All ({checkAllResults.length} kata bermasalah)
          </div>
          {checkAllResults.length === 0 ? <div className="text-sm text-mint">Semua kata valid ✓</div> : <ul className="space-y-1.5">
              {checkAllResults.map((r, i) => <li key={i} className="text-sm flex items-center gap-2 flex-wrap">
                  <span className="text-rust">{r.word}</span>
                  <span className="text-fog">→</span>
                  {r.suggestions && r.suggestions.length > 0 ? r.suggestions.slice(0, 3).map(s => <span key={s.word} className="text-xs px-2 py-0.5 rounded bg-line/60 text-fog">
                        {s.word} (d={s.distance})
                      </span>) : <span className="text-fog text-xs">tidak ada saran</span>}
                </li>)}
            </ul>}
        </div>}
    </div>;
}
