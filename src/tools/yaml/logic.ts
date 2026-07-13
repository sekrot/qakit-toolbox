export interface JsonToYamlResult {
  ok: boolean;
  output?: string;
  error?: string;
}

export function jsonToYaml(input: string, indent = 2): JsonToYamlResult {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, error: 'Input is empty' };
  let value: unknown;
  try {
    value = JSON.parse(trimmed);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
  return { ok: true, output: stringifyYaml(value, indent) };
}

export function downloadYaml(content: string, filename = 'data.yaml'): void {
  const blob = new Blob([content], { type: 'text/yaml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function stringifyYaml(value: unknown, indentSize: number): string {
  if (isCollection(value) && !isEmptyCollection(value)) {
    return toLines(value, indentSize).join('\n') + '\n';
  }
  return emitScalarOrEmptyCollection(value) + '\n';
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isCollection(value: unknown): value is Record<string, unknown> | unknown[] {
  return Array.isArray(value) || isPlainObject(value);
}

function isEmptyCollection(value: unknown): boolean {
  if (Array.isArray(value)) return value.length === 0;
  if (isPlainObject(value)) return Object.keys(value).length === 0;
  return false;
}

function emitScalarOrEmptyCollection(value: unknown): string {
  if (Array.isArray(value)) return '[]';
  if (isPlainObject(value)) return '{}';
  return emitScalar(value);
}

/** Renders a value as YAML lines with no leading indentation — callers indent
 * the whole block (nested value under a key) or prefix the first line with
 * "- " and indent the rest by 2 (sequence item). */
function toLines(value: unknown, indentSize: number): string[] {
  if (Array.isArray(value)) return arrayLines(value, indentSize);
  if (isPlainObject(value)) return objectLines(value, indentSize);
  return [emitScalar(value)];
}

function indentLines(lines: string[], n: number): string[] {
  const pad = ' '.repeat(n);
  return lines.map((l) => (l.length ? pad + l : l));
}

function objectLines(obj: Record<string, unknown>, indentSize: number): string[] {
  const entries = Object.entries(obj);
  const out: string[] = [];
  for (const [key, val] of entries) {
    const keyStr = formatScalarString(key);
    if (isCollection(val) && !isEmptyCollection(val)) {
      out.push(`${keyStr}:`);
      out.push(...indentLines(toLines(val, indentSize), indentSize));
    } else {
      out.push(`${keyStr}: ${emitScalarOrEmptyCollection(val)}`);
    }
  }
  return out;
}

function arrayLines(arr: unknown[], indentSize: number): string[] {
  const out: string[] = [];
  for (const item of arr) {
    if (isCollection(item) && !isEmptyCollection(item)) {
      const itemLines = toLines(item, indentSize);
      out.push(`- ${itemLines[0]}`);
      out.push(...indentLines(itemLines.slice(1), 2));
    } else {
      out.push(`- ${emitScalarOrEmptyCollection(item)}`);
    }
  }
  return out;
}

function emitScalar(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'null';
  if (typeof value === 'string') return formatScalarString(value);
  return JSON.stringify(value);
}

const RESERVED_SCALARS = new Set([
  'null',
  'Null',
  'NULL',
  '~',
  'true',
  'True',
  'TRUE',
  'false',
  'False',
  'FALSE',
  'yes',
  'Yes',
  'YES',
  'no',
  'No',
  'NO',
  'y',
  'Y',
  'n',
  'N',
  'on',
  'On',
  'ON',
  'off',
  'Off',
  'OFF',
]);

const NUMBER_LIKE = /^[-+]?(\d+(\.\d*)?|\.\d+)([eE][-+]?\d+)?$/;
const DATE_LIKE = /^\d{4}-\d{2}-\d{2}([Tt ].*)?$/;
const SPECIAL_FIRST_CHAR = /^[-?:,[\]{}#&*!|>'"%@`]/;

function needsQuoting(s: string): boolean {
  if (s === '') return true;
  if (RESERVED_SCALARS.has(s)) return true;
  if (NUMBER_LIKE.test(s)) return true;
  if (DATE_LIKE.test(s)) return true;
  if (SPECIAL_FIRST_CHAR.test(s)) return true;
  if (/^\s|\s$/.test(s)) return true;
  if (/[\n\t]/.test(s)) return true;
  if (s.includes(': ') || s.endsWith(':')) return true;
  if (s.includes(' #')) return true;
  return false;
}

/** YAML double-quoted scalar syntax is a superset of JSON string syntax, so
 * JSON.stringify already produces a valid, correctly-escaped YAML scalar. */
function formatScalarString(s: string): string {
  return needsQuoting(s) ? JSON.stringify(s) : s;
}
