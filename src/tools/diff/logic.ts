import { diffLines, diffWordsWithSpace } from 'diff';

export type ChangeKind = 'add' | 'remove' | 'context';

export interface DiffLine {
  kind: ChangeKind;
  text: string;
  oldNum?: number;
  newNum?: number;
}

export interface DiffOptions {
  ignoreWhitespace?: boolean;
  ignoreCase?: boolean;
}

export interface DiffStats {
  added: number;
  removed: number;
  unchanged: number;
}

export interface DiffResult {
  lines: DiffLine[];
  stats: DiffStats;
}

export function computeLineDiff(
  left: string,
  right: string,
  options: DiffOptions = {},
): DiffResult {
  const a = options.ignoreCase ? left.toLowerCase() : left;
  const b = options.ignoreCase ? right.toLowerCase() : right;
  const parts = diffLines(a, b, {
    ignoreWhitespace: options.ignoreWhitespace,
  });

  const lines: DiffLine[] = [];
  let oldNum = 1;
  let newNum = 1;
  let added = 0;
  let removed = 0;
  let unchanged = 0;

  for (const part of parts) {
    const rows = part.value.replace(/\n$/, '').split('\n');
    for (const text of rows) {
      if (part.added) {
        lines.push({ kind: 'add', text, newNum: newNum++ });
        added++;
      } else if (part.removed) {
        lines.push({ kind: 'remove', text, oldNum: oldNum++ });
        removed++;
      } else {
        lines.push({ kind: 'context', text, oldNum: oldNum++, newNum: newNum++ });
        unchanged++;
      }
    }
  }
  return { lines, stats: { added, removed, unchanged } };
}

export interface InlineSegment {
  text: string;
  kind: ChangeKind;
}

export function computeInlineDiff(
  left: string,
  right: string,
  options: DiffOptions = {},
): InlineSegment[] {
  const a = options.ignoreCase ? left.toLowerCase() : left;
  const b = options.ignoreCase ? right.toLowerCase() : right;
  const parts = diffWordsWithSpace(a, b);
  return parts.map((p) => ({
    text: p.value,
    kind: p.added ? 'add' : p.removed ? 'remove' : 'context',
  }));
}
