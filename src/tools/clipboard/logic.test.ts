import { describe, expect, it } from 'vitest';
import {
  pushItem,
  togglePin,
  removeItem,
  clearUnpinned,
  searchItems,
  trim,
  CLIPBOARD_LIMIT,
  type ClipboardItem,
} from './logic';

const mkItem = (overrides: Partial<ClipboardItem> = {}): ClipboardItem => ({
  id: overrides.id ?? Math.random().toString(36),
  text: overrides.text ?? 'sample',
  pinned: overrides.pinned ?? false,
  ts: overrides.ts ?? Date.now(),
});

describe('pushItem', () => {
  it('prepends new entry', () => {
    const next = pushItem([], 'hello');
    expect(next).toHaveLength(1);
    expect(next[0].text).toBe('hello');
  });

  it('ignores empty/whitespace-only text', () => {
    expect(pushItem([], '   ')).toEqual([]);
  });

  it('moves existing entry to top with new timestamp', () => {
    const a = mkItem({ text: 'a', ts: 1 });
    const b = mkItem({ text: 'b', ts: 2 });
    const next = pushItem([a, b], 'a', 100);
    expect(next[0].text).toBe('a');
    expect(next[0].ts).toBe(100);
    expect(next).toHaveLength(2);
  });

  it('trims to CLIPBOARD_LIMIT', () => {
    const items = Array.from({ length: CLIPBOARD_LIMIT + 5 }, (_, i) => mkItem({ text: `t${i}` }));
    const next = pushItem(items, 'fresh');
    expect(next).toHaveLength(CLIPBOARD_LIMIT);
    expect(next[0].text).toBe('fresh');
  });

  it('preserves pinned items beyond the limit', () => {
    const pinned = mkItem({ text: 'p', pinned: true });
    const items = [
      pinned,
      ...Array.from({ length: CLIPBOARD_LIMIT }, (_, i) => mkItem({ text: `t${i}` })),
    ];
    const next = pushItem(items, 'fresh');
    expect(next.find((i) => i.text === 'p')).toBeDefined();
  });
});

describe('togglePin / removeItem / clearUnpinned', () => {
  it('toggles pin state', () => {
    const a = mkItem({ text: 'a' });
    const next = togglePin([a], a.id);
    expect(next[0].pinned).toBe(true);
  });
  it('removes by id', () => {
    const a = mkItem({ text: 'a' });
    const b = mkItem({ text: 'b' });
    expect(removeItem([a, b], a.id)).toHaveLength(1);
  });
  it('clears only unpinned', () => {
    const a = mkItem({ text: 'a', pinned: true });
    const b = mkItem({ text: 'b', pinned: false });
    expect(clearUnpinned([a, b])).toEqual([a]);
  });
});

describe('searchItems', () => {
  it('returns all when query empty', () => {
    const a = mkItem({ text: 'a' });
    expect(searchItems([a], '')).toEqual([a]);
  });
  it('case-insensitive substring match', () => {
    const a = mkItem({ text: 'Hello World' });
    expect(searchItems([a], 'WORLD')).toEqual([a]);
  });
});

describe('trim', () => {
  it('keeps all pinned entries even past limit', () => {
    const items: ClipboardItem[] = [
      ...Array.from({ length: 5 }, (_, i) => mkItem({ text: `pin${i}`, pinned: true })),
      ...Array.from({ length: CLIPBOARD_LIMIT + 10 }, (_, i) => mkItem({ text: `t${i}` })),
    ];
    const next = trim(items);
    expect(next.filter((i) => i.pinned)).toHaveLength(5);
    expect(next).toHaveLength(CLIPBOARD_LIMIT);
  });
});
