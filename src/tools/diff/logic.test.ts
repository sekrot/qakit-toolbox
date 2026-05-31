import { describe, expect, it } from 'vitest';
import { computeLineDiff, computeInlineDiff } from './logic';

describe('computeLineDiff', () => {
  it('detects added and removed lines', () => {
    const r = computeLineDiff('a\nb\nc', 'a\nB\nc');
    expect(r.stats.added).toBe(1);
    expect(r.stats.removed).toBe(1);
    expect(r.stats.unchanged).toBe(2);
  });

  it('ignores whitespace when configured', () => {
    const r = computeLineDiff('a\n  b\nc', 'a\nb\nc', { ignoreWhitespace: true });
    expect(r.stats.added).toBe(0);
    expect(r.stats.removed).toBe(0);
  });

  it('ignores case when configured', () => {
    const r = computeLineDiff('Hello', 'hello', { ignoreCase: true });
    expect(r.stats.added).toBe(0);
    expect(r.stats.removed).toBe(0);
  });

  it('assigns line numbers correctly', () => {
    const r = computeLineDiff('a\nb', 'a\nc\nd');
    const removed = r.lines.find((l) => l.kind === 'remove');
    expect(removed?.oldNum).toBe(2);
    expect(removed?.newNum).toBeUndefined();
  });

  it('handles identical inputs', () => {
    const r = computeLineDiff('same', 'same');
    expect(r.stats.added).toBe(0);
    expect(r.stats.removed).toBe(0);
    expect(r.stats.unchanged).toBe(1);
  });
});

describe('computeInlineDiff', () => {
  it('marks word-level changes', () => {
    const segs = computeInlineDiff('hello world', 'hello there');
    expect(segs.some((s) => s.kind === 'add')).toBe(true);
    expect(segs.some((s) => s.kind === 'remove')).toBe(true);
  });
});
