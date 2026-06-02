import { describe, expect, it } from 'vitest';
import { getSuggestions } from './autocomplete';

const sample = {
  store: {
    book: [
      { title: 'A', price: 10 },
      { title: 'B', price: 20 },
    ],
    bicycle: { color: 'red', price: 100 },
  },
  meta: { count: 2 },
};

describe('getSuggestions', () => {
  it('suggests top-level keys after $.', () => {
    const r = getSuggestions(sample, '$.');
    expect(r.suggestions).toEqual(['store', 'meta']);
    expect(r.prefix).toBe('');
    expect(r.inBracket).toBe(false);
  });

  it('filters top-level keys by typed prefix', () => {
    const r = getSuggestions(sample, '$.st');
    expect(r.suggestions).toEqual(['store']);
    expect(r.prefix).toBe('st');
    expect(r.replaceLen).toBe(2);
  });

  it('descends into nested objects', () => {
    const r = getSuggestions(sample, '$.store.');
    expect(r.suggestions).toEqual(['book', 'bicycle']);
  });

  it('walks past array index', () => {
    const r = getSuggestions(sample, '$.store.book[0].');
    expect(r.suggestions).toEqual(['title', 'price']);
  });

  it('treats [*] as representative element', () => {
    const r = getSuggestions(sample, '$.store.book[*].');
    expect(r.suggestions).toEqual(['title', 'price']);
  });

  it('filters by full prefix at object level', () => {
    // Cursor is still in `store`, prefix "book" filters its keys.
    const r = getSuggestions(sample, '$.store.book');
    expect(r.suggestions).toEqual(['book']);
  });

  it('suggests array slots after open bracket', () => {
    const r = getSuggestions(sample, '$.store.book[');
    expect(r.suggestions).toContain('*');
    expect(r.suggestions).toContain('0');
    expect(r.suggestions).toContain('1');
    expect(r.inBracket).toBe(true);
  });

  it('filters bracket completions by digit prefix', () => {
    const r = getSuggestions(sample, '$.store.book[1');
    expect(r.suggestions).toEqual(['1']);
  });

  it('handles bracket-string keys', () => {
    // After ['book'] we are inside the array; opening a new bracket should
    // suggest indices and the wildcard.
    const r = getSuggestions(sample, "$.store['book'][");
    expect(r.suggestions).toContain('*');
    expect(r.suggestions).toContain('0');
  });

  it('descends into store via bracket-string keys', () => {
    // $.store['  → cursor is `store`, prefix is empty after `'`, in-bracket.
    const r = getSuggestions(sample, "$.store['");
    expect(r.suggestions).toContain("'book'");
    expect(r.suggestions).toContain("'bicycle'");
  });

  it('returns empty for unknown path', () => {
    expect(getSuggestions(sample, '$.no.such.path.').suggestions).toEqual([]);
  });

  it('returns empty when value is undefined', () => {
    expect(getSuggestions(undefined, '$.foo').suggestions).toEqual([]);
  });

  it('handles missing $ prefix gracefully', () => {
    const r = getSuggestions(sample, 'store.');
    expect(r.suggestions).toEqual(['book', 'bicycle']);
  });
});
