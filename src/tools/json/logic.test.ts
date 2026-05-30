import { describe, expect, it } from 'vitest';
import { formatJson, minifyJson, validateJson } from './logic';
import { runJsonPath } from './jsonpath';

describe('formatJson', () => {
  it('formats valid JSON with 2-space indent', () => {
    const r = formatJson('{"a":1,"b":[1,2]}');
    expect(r.ok).toBe(true);
    expect(r.output).toBe('{\n  "a": 1,\n  "b": [\n    1,\n    2\n  ]\n}');
  });

  it('honors custom indent', () => {
    const r = formatJson('{"a":1}', 4);
    expect(r.output).toBe('{\n    "a": 1\n}');
  });

  it('reports error with line and column on invalid JSON', () => {
    const r = formatJson('{\n  "a": 1,\n  "b": }');
    expect(r.ok).toBe(false);
    expect(r.error?.message).toBeDefined();
    expect(r.error?.line).toBeGreaterThan(0);
  });

  it('errors on empty input', () => {
    expect(formatJson('   ').ok).toBe(false);
  });
});

describe('minifyJson', () => {
  it('strips whitespace', () => {
    const r = minifyJson('{\n  "a": 1,\n  "b": [1, 2]\n}');
    expect(r.output).toBe('{"a":1,"b":[1,2]}');
  });
});

describe('validateJson', () => {
  it('returns ok for valid JSON', () => {
    expect(validateJson('[1,2,3]').ok).toBe(true);
  });

  it('returns error for trailing comma', () => {
    expect(validateJson('[1,2,]').ok).toBe(false);
  });
});

describe('runJsonPath', () => {
  const data = { store: { book: [{ price: 10 }, { price: 20 }] } };

  it('returns matches for valid path', () => {
    const r = runJsonPath(data, '$.store.book[*].price');
    expect(r.ok).toBe(true);
    expect(r.matches).toEqual([10, 20]);
  });

  it('returns empty array for non-matching path', () => {
    const r = runJsonPath(data, '$.missing');
    expect(r.ok).toBe(true);
    expect(r.matches).toEqual([]);
  });

  it('errors on empty path', () => {
    expect(runJsonPath(data, '').ok).toBe(false);
  });
});
