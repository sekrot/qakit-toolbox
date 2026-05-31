import { describe, expect, it } from 'vitest';
import { parseHex, rgbToHex, rgbToHsl, rgbToCmyk, formatRgb, formatHsl, formatCmyk } from './logic';

describe('parseHex', () => {
  it('parses 6-digit hex', () => {
    expect(parseHex('#FF8800')).toEqual({ r: 255, g: 136, b: 0 });
  });
  it('parses 3-digit hex', () => {
    expect(parseHex('#f80')).toEqual({ r: 255, g: 136, b: 0 });
  });
  it('accepts no leading hash', () => {
    expect(parseHex('ff8800')).toEqual({ r: 255, g: 136, b: 0 });
  });
  it('returns null for invalid', () => {
    expect(parseHex('#zzz')).toBeNull();
    expect(parseHex('')).toBeNull();
  });
});

describe('rgbToHex', () => {
  it('roundtrips', () => {
    expect(rgbToHex({ r: 255, g: 136, b: 0 })).toBe('#ff8800');
  });
  it('clamps out-of-range', () => {
    expect(rgbToHex({ r: 300, g: -10, b: 128 })).toBe('#ff0080');
  });
});

describe('rgbToHsl', () => {
  it('converts known colors', () => {
    expect(rgbToHsl({ r: 255, g: 0, b: 0 })).toEqual({ h: 0, s: 100, l: 50 });
    expect(rgbToHsl({ r: 0, g: 255, b: 0 })).toEqual({ h: 120, s: 100, l: 50 });
    expect(rgbToHsl({ r: 0, g: 0, b: 255 })).toEqual({ h: 240, s: 100, l: 50 });
  });
  it('handles grayscale', () => {
    expect(rgbToHsl({ r: 128, g: 128, b: 128 })).toEqual({ h: 0, s: 0, l: 50 });
  });
});

describe('rgbToCmyk', () => {
  it('handles pure red', () => {
    expect(rgbToCmyk({ r: 255, g: 0, b: 0 })).toEqual({ c: 0, m: 100, y: 100, k: 0 });
  });
  it('handles black', () => {
    expect(rgbToCmyk({ r: 0, g: 0, b: 0 })).toEqual({ c: 0, m: 0, y: 0, k: 100 });
  });
  it('handles white', () => {
    expect(rgbToCmyk({ r: 255, g: 255, b: 255 })).toEqual({ c: 0, m: 0, y: 0, k: 0 });
  });
});

describe('formatters', () => {
  it('formats rgb()', () => {
    expect(formatRgb({ r: 1, g: 2, b: 3 })).toBe('rgb(1, 2, 3)');
  });
  it('formats hsl()', () => {
    expect(formatHsl({ h: 120, s: 50, l: 40 })).toBe('hsl(120, 50%, 40%)');
  });
  it('formats cmyk()', () => {
    expect(formatCmyk({ c: 10, m: 20, y: 30, k: 40 })).toBe('cmyk(10%, 20%, 30%, 40%)');
  });
});
