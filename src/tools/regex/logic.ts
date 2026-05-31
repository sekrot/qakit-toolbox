export interface RegexMatch {
  match: string;
  index: number;
  length: number;
  groups: string[];
  namedGroups: Record<string, string>;
}

export interface RegexRunResult {
  ok: boolean;
  matches: RegexMatch[];
  error?: string;
}

export function buildRegex(
  pattern: string,
  flags: string,
): { ok: boolean; regex?: RegExp; error?: string } {
  if (!pattern) return { ok: false, error: 'Empty pattern' };
  try {
    return { ok: true, regex: new RegExp(pattern, flags) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export function runRegex(pattern: string, flags: string, input: string): RegexRunResult {
  const built = buildRegex(pattern, ensureGlobal(flags));
  if (!built.ok || !built.regex) return { ok: false, matches: [], error: built.error };

  const matches: RegexMatch[] = [];
  let last = -1;
  let safety = 10000;

  for (const m of input.matchAll(built.regex)) {
    if (safety-- <= 0) break;
    if (m.index === undefined) continue;
    if (m[0].length === 0) {
      if (m.index === last) break;
      last = m.index;
    }
    matches.push({
      match: m[0],
      index: m.index,
      length: m[0].length,
      groups: m.slice(1).map((g) => g ?? ''),
      namedGroups: { ...(m.groups ?? {}) },
    });
  }
  return { ok: true, matches };
}

function ensureGlobal(flags: string): string {
  return flags.includes('g') ? flags : flags + 'g';
}

export interface HighlightSegment {
  text: string;
  matchIndex?: number;
}

export function highlight(input: string, matches: RegexMatch[]): HighlightSegment[] {
  if (matches.length === 0) return [{ text: input }];
  const segments: HighlightSegment[] = [];
  let cursor = 0;
  matches.forEach((m, i) => {
    if (m.index > cursor) segments.push({ text: input.slice(cursor, m.index) });
    segments.push({ text: input.slice(m.index, m.index + m.length), matchIndex: i });
    cursor = m.index + m.length;
  });
  if (cursor < input.length) segments.push({ text: input.slice(cursor) });
  return segments;
}

export const FLAG_INFO: { flag: string; name: string; description: string }[] = [
  { flag: 'g', name: 'global', description: 'Find all matches' },
  { flag: 'i', name: 'ignore case', description: 'Case-insensitive' },
  { flag: 'm', name: 'multiline', description: '^ and $ match line breaks' },
  { flag: 's', name: 'dotall', description: '. matches newlines' },
  { flag: 'u', name: 'unicode', description: 'Unicode mode' },
  { flag: 'y', name: 'sticky', description: 'Match from lastIndex' },
];

export const CHEATSHEET: { syntax: string; meaning: string }[] = [
  { syntax: '.', meaning: 'Any character (except newline)' },
  { syntax: '\\d / \\D', meaning: 'Digit / non-digit' },
  { syntax: '\\w / \\W', meaning: 'Word char / non-word' },
  { syntax: '\\s / \\S', meaning: 'Whitespace / non-whitespace' },
  { syntax: '\\b / \\B', meaning: 'Word boundary / non-boundary' },
  { syntax: '^ / $', meaning: 'Start / end of string (or line with m)' },
  { syntax: '*', meaning: '0 or more (greedy)' },
  { syntax: '+', meaning: '1 or more (greedy)' },
  { syntax: '?', meaning: '0 or 1 / lazy modifier' },
  { syntax: '{n,m}', meaning: 'Between n and m repetitions' },
  { syntax: '(...)', meaning: 'Capturing group' },
  { syntax: '(?:...)', meaning: 'Non-capturing group' },
  { syntax: '(?<name>...)', meaning: 'Named capturing group' },
  { syntax: '(?=...) / (?!...)', meaning: 'Lookahead / negative lookahead' },
  { syntax: '[abc] / [^abc]', meaning: 'Character class / negated' },
  { syntax: 'a|b', meaning: 'Alternation' },
];
