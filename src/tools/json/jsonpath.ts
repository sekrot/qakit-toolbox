import { JSONPath } from 'jsonpath-plus';

export interface JsonPathResult {
  ok: boolean;
  matches?: unknown[];
  output?: string;
  error?: string;
}

export function runJsonPath(value: unknown, path: string): JsonPathResult {
  const trimmed = path.trim();
  if (!trimmed) return { ok: false, error: 'Path is empty' };
  try {
    const matches = JSONPath({ path: trimmed, json: value as object }) as unknown[];
    return {
      ok: true,
      matches,
      output: JSON.stringify(matches, null, 2),
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
