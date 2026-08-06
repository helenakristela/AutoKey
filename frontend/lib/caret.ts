export function getCaretCharOffset(root: HTMLElement): number {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return 0;
  const range = sel.getRangeAt(0);
  const preRange = range.cloneRange();
  preRange.selectNodeContents(root);
  preRange.setEnd(range.endContainer, range.endOffset);
  return preRange.toString().length;
}
export function setCaretCharOffset(root: HTMLElement, offset: number) {
  const sel = window.getSelection();
  if (!sel) return;
  let remaining = offset;
  let targetNode: Node | null = null;
  let targetOffset = 0;
  const walk = (node: Node): boolean => {
    if (node.nodeType === Node.TEXT_NODE) {
      const len = node.textContent?.length || 0;
      if (remaining <= len) {
        targetNode = node;
        targetOffset = remaining;
        return true;
      }
      remaining -= len;
      return false;
    }
    for (let i = 0; i < node.childNodes.length; i++) {
      if (walk(node.childNodes[i])) return true;
    }
    return false;
  };
  walk(root);
  if (targetNode) {
    const range = document.createRange();
    range.setStart(targetNode, targetOffset);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  } else {
    const range = document.createRange();
    range.selectNodeContents(root);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  }
}
export function getCurrentWord(text: string, caretOffset: number): {
  word: string;
  start: number;
} {
  let start = caretOffset;
  while (start > 0 && /[a-zA-Z']/.test(text[start - 1])) start--;
  const word = text.slice(start, caretOffset);
  return {
    word,
    start
  };
}
