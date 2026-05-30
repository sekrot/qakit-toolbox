import { describe, expect, it } from 'vitest';
import { generate, generateMany, isValidUuid } from './logic';

describe('generate', () => {
  it('v4 has correct version and variant bits', () => {
    const id = generate('v4');
    expect(isValidUuid(id)).toBe(true);
    expect(id[14]).toBe('4');
    expect('89ab'.includes(id[19])).toBe(true);
  });

  it('v7 has correct version bit and is sortable by time', async () => {
    const a = generate('v7');
    await new Promise((r) => setTimeout(r, 5));
    const b = generate('v7');
    expect(isValidUuid(a)).toBe(true);
    expect(a[14]).toBe('7');
    expect(b[14]).toBe('7');
    expect(a < b).toBe(true);
  });

  it('nil returns all zeros', () => {
    expect(generate('nil')).toBe('00000000-0000-0000-0000-000000000000');
  });
});

describe('generateMany', () => {
  it('produces requested count', () => {
    expect(generateMany('v4', 5)).toHaveLength(5);
  });
  it('clamps invalid count', () => {
    expect(generateMany('v4', 0)).toHaveLength(1);
    expect(generateMany('v4', 5000)).toHaveLength(1000);
  });
  it('produces unique v4 values', () => {
    const ids = generateMany('v4', 100);
    expect(new Set(ids).size).toBe(100);
  });
});

describe('isValidUuid', () => {
  it('accepts canonical UUID', () => {
    expect(isValidUuid('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
  });
  it('rejects garbage', () => {
    expect(isValidUuid('not-a-uuid')).toBe(false);
    expect(isValidUuid('')).toBe(false);
  });
});
