/**
 * JSONPath autocomplete: given the parsed JSON value and the path the user
 * is currently typing, walk the completed portion of the path and return
 * keys / indices that could come next.
 *
 * Supported syntax (covers the common ~90% of JSONPath usage):
 *   - dot notation:        $.foo.bar
 *   - bracket index:       $.foo[0]
 *   - bracket wildcard:    $.foo[*].bar
 *   - bracket string key:  $.foo['bar']
 */

export interface AutocompleteResult {
  /** Filtered candidate completions. */
  suggestions: string[];
  /** Substring already typed for the current segment (used to filter / replace). */
  prefix: string;
  /** Number of trailing characters in `path` to replace when inserting a suggestion. */
  replaceLen: number;
  /** True when the current segment is bracket-style ([...] vs dot). */
  inBracket: boolean;
}

type Segment =
  | { kind: 'key'; value: string }
  | { kind: 'index'; value: number }
  | { kind: 'wildcard' };

const EMPTY: AutocompleteResult = { suggestions: [], prefix: '', replaceLen: 0, inBracket: false };

export function getSuggestions(value: unknown, path: string): AutocompleteResult {
  if (value === undefined) return EMPTY;
  const trimmed = path.startsWith('$') ? path.slice(1) : path;

  // Determine where the current (in-progress) segment starts.
  const { completed, prefix, inBracket } = splitTail(trimmed);

  // Walk completed segments down the value tree.
  let cursor: unknown = value;
  for (const seg of parseSegments(completed)) {
    cursor = descend(cursor, seg);
    if (cursor === undefined) return EMPTY;
  }

  const candidates = suggestionsFor(cursor, inBracket);
  const filtered = candidates.filter((s) => {
    if (!prefix) return true;
    const p = inBracket ? stripQuotes(prefix.toLowerCase()) : prefix.toLowerCase();
    const c = inBracket ? stripQuotes(s.toLowerCase()) : s.toLowerCase();
    return c.startsWith(p);
  });

  return {
    suggestions: filtered,
    prefix,
    replaceLen: prefix.length,
    inBracket,
  };
}

function splitTail(trimmed: string): { completed: string; prefix: string; inBracket: boolean } {
  // Find the last position where a new segment could start: after '.' (dot
  // notation) or after '[' (bracket notation).
  let lastBoundary = -1;
  let inBracket = false;
  let bracketStart = -1;
  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (ch === '[') {
      inBracket = true;
      bracketStart = i;
    } else if (ch === ']') {
      inBracket = false;
      lastBoundary = i;
    } else if (ch === '.' && !inBracket) {
      lastBoundary = i;
    }
  }

  if (inBracket) {
    return {
      completed: trimmed.slice(0, bracketStart),
      prefix: trimmed.slice(bracketStart + 1),
      inBracket: true,
    };
  }
  return {
    completed: trimmed.slice(0, lastBoundary + 1),
    prefix: trimmed.slice(lastBoundary + 1),
    inBracket: false,
  };
}

function parseSegments(completed: string): Segment[] {
  const out: Segment[] = [];
  let i = 0;
  while (i < completed.length) {
    const ch = completed[i];
    if (ch === '.') {
      i++;
      continue;
    }
    if (ch === '[') {
      const end = completed.indexOf(']', i);
      if (end < 0) break;
      const inner = completed.slice(i + 1, end).trim();
      if (inner === '*') out.push({ kind: 'wildcard' });
      else if (/^-?\d+$/.test(inner)) out.push({ kind: 'index', value: Number(inner) });
      else if (/^['"].*['"]$/.test(inner)) out.push({ kind: 'key', value: inner.slice(1, -1) });
      else out.push({ kind: 'key', value: inner });
      i = end + 1;
      continue;
    }
    // bare key — read up to next '.' or '['
    const start = i;
    while (i < completed.length && completed[i] !== '.' && completed[i] !== '[') i++;
    const key = completed.slice(start, i);
    if (key) out.push({ kind: 'key', value: key });
  }
  return out;
}

function descend(cursor: unknown, seg: Segment): unknown {
  if (cursor === null || cursor === undefined) return undefined;
  if (seg.kind === 'key') {
    if (Array.isArray(cursor)) return undefined;
    if (typeof cursor === 'object') return (cursor as Record<string, unknown>)[seg.value];
    return undefined;
  }
  if (seg.kind === 'index') {
    if (Array.isArray(cursor)) return cursor[seg.value];
    return undefined;
  }
  // wildcard: take the first element as a representative shape
  if (Array.isArray(cursor)) return cursor[0];
  if (typeof cursor === 'object') {
    const values = Object.values(cursor as Record<string, unknown>);
    return values[0];
  }
  return undefined;
}

function suggestionsFor(cursor: unknown, inBracket: boolean): string[] {
  if (cursor === null || cursor === undefined) return [];
  if (Array.isArray(cursor)) {
    const limit = Math.min(cursor.length, 10);
    const indices: string[] = [];
    for (let i = 0; i < limit; i++) indices.push(inBracket ? String(i) : `[${i}]`);
    return [inBracket ? '*' : '[*]', ...indices];
  }
  if (typeof cursor === 'object') {
    const keys = Object.keys(cursor as Record<string, unknown>);
    return inBracket ? keys.map((k) => `'${k}'`) : keys;
  }
  return [];
}

function stripQuotes(s: string): string {
  return s.replace(/^['"]/, '').replace(/['"]$/, '');
}
