import { describe, expect, it } from 'vitest';
import {
  DEFAULT_OPTIONS,
  buildPool,
  charsetFor,
  entropyBits,
  generatePassword,
  secureRandomInt,
  strengthOf,
  type PasswordOptions,
} from './logic';

const opts = (patch: Partial<PasswordOptions> = {}): PasswordOptions => ({
  ...DEFAULT_OPTIONS,
  ...patch,
});

describe('generatePassword', () => {
  it('produces the requested length', () => {
    expect(generatePassword(opts({ length: 24 }))).toHaveLength(24);
    expect(generatePassword(opts({ length: 4 }))).toHaveLength(4);
  });

  it('only uses characters from enabled sets', () => {
    const pw = generatePassword(
      opts({ length: 64, uppercase: false, symbols: false, digits: false }),
    );
    expect(pw).toMatch(/^[a-z]+$/);
  });

  it('guarantees one character from each set when requireEachSet is on', () => {
    for (let i = 0; i < 20; i++) {
      const pw = generatePassword(opts({ length: 4, requireEachSet: true }));
      expect(pw).toMatch(/[A-Z]/);
      expect(pw).toMatch(/[a-z]/);
      expect(pw).toMatch(/[0-9]/);
      expect(pw).toMatch(/[^A-Za-z0-9]/);
    }
  });

  it('never emits ambiguous characters when excluded', () => {
    const pw = generatePassword(opts({ length: 64, excludeAmbiguous: true }));
    for (const c of 'IlO0o1') expect(pw).not.toContain(c);
  });

  it('returns empty string when no sets are enabled', () => {
    const pw = generatePassword(
      opts({ uppercase: false, lowercase: false, digits: false, symbols: false }),
    );
    expect(pw).toBe('');
  });

  it('is deterministic with an injected rng', () => {
    const rng = (max: number) => 0 % max;
    const a = generatePassword(opts({ requireEachSet: false }), rng);
    const b = generatePassword(opts({ requireEachSet: false }), rng);
    expect(a).toBe(b);
  });
});

describe('charsetFor / buildPool', () => {
  it('filters ambiguous characters', () => {
    expect(charsetFor('digits', true)).not.toContain('0');
    expect(charsetFor('digits', true)).not.toContain('1');
    expect(charsetFor('uppercase', true)).not.toContain('I');
    expect(charsetFor('lowercase', true)).not.toContain('l');
  });

  it('concatenates only enabled sets', () => {
    const pool = buildPool(opts({ symbols: false, digits: false }));
    expect(pool).toMatch(/^[A-Za-z]+$/);
    expect(pool).toHaveLength(52);
  });
});

describe('entropyBits / strengthOf', () => {
  it('computes length × log2(pool size)', () => {
    // digits only: pool 10 → log2 ≈ 3.32; 16 chars ≈ 53 bits
    const bits = entropyBits(
      opts({ uppercase: false, lowercase: false, symbols: false, length: 16 }),
    );
    expect(bits).toBe(Math.round(16 * Math.log2(10)));
  });

  it('returns 0 for an empty pool', () => {
    expect(
      entropyBits(opts({ uppercase: false, lowercase: false, digits: false, symbols: false })),
    ).toBe(0);
  });

  it('maps bits to strength levels', () => {
    expect(strengthOf(20)).toBe('weak');
    expect(strengthOf(50)).toBe('fair');
    expect(strengthOf(70)).toBe('good');
    expect(strengthOf(120)).toBe('strong');
  });
});

describe('secureRandomInt', () => {
  it('stays within range', () => {
    for (let i = 0; i < 100; i++) {
      const n = secureRandomInt(7);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(7);
    }
  });

  it('throws for non-positive max', () => {
    expect(() => secureRandomInt(0)).toThrow();
  });
});
