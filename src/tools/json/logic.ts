export interface JsonError {
  message: string;
  line?: number;
  column?: number;
  position?: number;
}

export interface JsonResult {
  ok: boolean;
  output?: string;
  value?: unknown;
  error?: JsonError;
}

export function formatJson(input: string, indent = 2): JsonResult {
  const parsed = safeParse(input);
  if (!parsed.ok) return parsed;
  return { ok: true, output: JSON.stringify(parsed.value, null, indent), value: parsed.value };
}

export function minifyJson(input: string): JsonResult {
  const parsed = safeParse(input);
  if (!parsed.ok) return parsed;
  return { ok: true, output: JSON.stringify(parsed.value), value: parsed.value };
}

export function validateJson(input: string): JsonResult {
  return safeParse(input);
}

function safeParse(input: string): JsonResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: false, error: { message: 'Input is empty' } };
  }
  try {
    const value = JSON.parse(trimmed);
    return { ok: true, value };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const location = extractLocation(message, input);
    return { ok: false, error: { message, ...location } };
  }
}

function extractLocation(message: string, source: string): Partial<JsonError> {
  const match = message.match(/position (\d+)/i);
  const position = match ? Number(match[1]) : findErrorPosition(source);
  if (position == null || Number.isNaN(position)) return {};
  let line = 1;
  let column = 1;
  for (let i = 0; i < position && i < source.length; i++) {
    if (source[i] === '\n') {
      line++;
      column = 1;
    } else {
      column++;
    }
  }
  return { position, line, column };
}

function findErrorPosition(source: string): number | null {
  let lo = 0;
  let hi = source.length;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    try {
      JSON.parse(source.slice(0, mid));
      lo = mid;
    } catch {
      hi = mid - 1;
    }
  }
  return lo < source.length ? lo : null;
}
