import { describe, expect, it } from 'vitest';
import { buildRegex, runRegex, highlight } from './logic';

describe('buildRegex', () => {
  it('builds valid pattern', () => {
    expect(buildRegex('\\d+', 'g').ok).toBe(true);
  });
  it('errors on invalid pattern', () => {
    const r = buildRegex('(', 'g');
    expect(r.ok).toBe(false);
    expect(r.error).toBeDefined();
  });
  it('errors on empty pattern', () => {
    expect(buildRegex('', 'g').ok).toBe(false);
  });
});

describe('runRegex', () => {
  it('finds all matches with capturing groups', () => {
    const r = runRegex('(\\w+)@(\\w+)', '', 'a@b and c@d');
    expect(r.ok).toBe(true);
    expect(r.matches).toHaveLength(2);
    expect(r.matches[0].match).toBe('a@b');
    expect(r.matches[0].groups).toEqual(['a', 'b']);
    expect(r.matches[1].match).toBe('c@d');
  });

  it('captures named groups', () => {
    const r = runRegex('(?<name>\\w+)', 'g', 'hello world');
    expect(r.matches[0].namedGroups).toEqual({ name: 'hello' });
  });

  it('forces global flag for repeated matching', () => {
    const r = runRegex('\\d', '', '1 2 3');
    expect(r.matches).toHaveLength(3);
  });

  it('does not infinite-loop on zero-width matches', () => {
    const r = runRegex('a*', '', 'bbb');
    expect(r.ok).toBe(true);
    expect(r.matches.length).toBeLessThan(20);
  });

  it('case-insensitive flag works', () => {
    const r = runRegex('hello', 'i', 'Hello World');
    expect(r.matches).toHaveLength(1);
  });

  it('returns error for invalid pattern', () => {
    const r = runRegex('[', '', 'text');
    expect(r.ok).toBe(false);
  });
});

describe('highlight', () => {
  it('splits input into matched and unmatched segments', () => {
    const r = runRegex('\\d+', '', 'a 12 b 34');
    const segs = highlight('a 12 b 34', r.matches);
    expect(segs).toEqual([
      { text: 'a ' },
      { text: '12', matchIndex: 0 },
      { text: ' b ' },
      { text: '34', matchIndex: 1 },
    ]);
  });

  it('returns single segment when no matches', () => {
    expect(highlight('plain', [])).toEqual([{ text: 'plain' }]);
  });
});
