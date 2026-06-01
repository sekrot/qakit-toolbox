export interface ClipboardItem {
  id: string;
  text: string;
  pinned: boolean;
  ts: number;
}

export const CLIPBOARD_STORAGE_KEY = 'clipboard.history';
export const CLIPBOARD_LIMIT = 100;

export function pushItem(
  items: ClipboardItem[],
  text: string,
  now: number = Date.now(),
): ClipboardItem[] {
  const trimmed = text.replace(/\s+$/g, '');
  if (!trimmed) return items;
  const existing = items.find((i) => i.text === text);
  if (existing) {
    return [{ ...existing, ts: now }, ...items.filter((i) => i.id !== existing.id)];
  }
  const next: ClipboardItem[] = [{ id: cryptoId(), text, pinned: false, ts: now }, ...items];
  return trim(next);
}

export function trim(items: ClipboardItem[]): ClipboardItem[] {
  const pinned = items.filter((i) => i.pinned);
  const unpinned = items.filter((i) => !i.pinned).slice(0, CLIPBOARD_LIMIT - pinned.length);
  return [...pinned, ...unpinned];
}

export function togglePin(items: ClipboardItem[], id: string): ClipboardItem[] {
  return items.map((i) => (i.id === id ? { ...i, pinned: !i.pinned } : i));
}

export function removeItem(items: ClipboardItem[], id: string): ClipboardItem[] {
  return items.filter((i) => i.id !== id);
}

export function clearUnpinned(items: ClipboardItem[]): ClipboardItem[] {
  return items.filter((i) => i.pinned);
}

export function searchItems(items: ClipboardItem[], query: string): ClipboardItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((i) => i.text.toLowerCase().includes(q));
}

function cryptoId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}
