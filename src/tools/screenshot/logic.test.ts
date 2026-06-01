import { describe, expect, it } from 'vitest';
import { isPointInRect, makeId, PALETTE, type RectShape } from './logic';

describe('makeId', () => {
  it('returns a non-empty string', () => {
    const id = makeId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(5);
  });
  it('returns unique values', () => {
    const ids = new Set(Array.from({ length: 50 }, () => makeId()));
    expect(ids.size).toBe(50);
  });
});

describe('isPointInRect', () => {
  const rect: RectShape = {
    id: 'r',
    kind: 'rect',
    color: '#fff',
    strokeWidth: 2,
    x: 10,
    y: 20,
    w: 100,
    h: 50,
  };
  it('detects point inside', () => {
    expect(isPointInRect(50, 40, rect)).toBe(true);
  });
  it('handles edges', () => {
    expect(isPointInRect(10, 20, rect)).toBe(true);
    expect(isPointInRect(110, 70, rect)).toBe(true);
  });
  it('detects point outside', () => {
    expect(isPointInRect(0, 0, rect)).toBe(false);
    expect(isPointInRect(200, 100, rect)).toBe(false);
  });
  it('normalises negative width/height', () => {
    const flipped: RectShape = { ...rect, w: -100, h: -50, x: 110, y: 70 };
    expect(isPointInRect(50, 40, flipped)).toBe(true);
  });
});

describe('PALETTE', () => {
  it('has 8 colors', () => {
    expect(PALETTE).toHaveLength(8);
  });
  it('each entry is a valid hex', () => {
    expect(PALETTE.every((c) => /^#[0-9a-f]{6}$/i.test(c))).toBe(true);
  });
});
