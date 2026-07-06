export type SetKey = 'uppercase' | 'lowercase' | 'digits' | 'symbols';

export interface PasswordOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  digits: boolean;
  symbols: boolean;
  /** Skip look-alike characters (O/0, l/1/I, …). */
  excludeAmbiguous: boolean;
  /** Guarantee at least one character from every enabled set. */
  requireEachSet: boolean;
}

export const MIN_LENGTH = 4;
export const MAX_LENGTH = 64;

export const DEFAULT_OPTIONS: PasswordOptions = {
  length: 16,
  uppercase: true,
  lowercase: true,
  digits: true,
  symbols: true,
  excludeAmbiguous: false,
  requireEachSet: true,
};

export const SET_KEYS: SetKey[] = ['uppercase', 'lowercase', 'digits', 'symbols'];

const SETS: Record<SetKey, string> = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{}<>?/;:,.~',
};

const AMBIGUOUS = new Set('IlO0o1|`\'";:,.');

export function charsetFor(key: SetKey, excludeAmbiguous: boolean): string {
  const chars = SETS[key];
  if (!excludeAmbiguous) return chars;
  return [...chars].filter((c) => !AMBIGUOUS.has(c)).join('');
}

export function enabledSets(opts: PasswordOptions): SetKey[] {
  return SET_KEYS.filter((key) => opts[key]);
}

export function buildPool(opts: PasswordOptions): string {
  return enabledSets(opts)
    .map((key) => charsetFor(key, opts.excludeAmbiguous))
    .join('');
}

export type Rng = (maxExclusive: number) => number;

/** Uniform random int in [0, maxExclusive) via rejection sampling — no modulo bias. */
export const secureRandomInt: Rng = (maxExclusive) => {
  if (maxExclusive <= 0) throw new Error('maxExclusive must be positive');
  const limit = Math.floor(0x100000000 / maxExclusive) * maxExclusive;
  const buf = new Uint32Array(1);
  for (;;) {
    crypto.getRandomValues(buf);
    if (buf[0] < limit) return buf[0] % maxExclusive;
  }
};

export function generatePassword(opts: PasswordOptions, rng: Rng = secureRandomInt): string {
  const sets = enabledSets(opts)
    .map((key) => charsetFor(key, opts.excludeAmbiguous))
    .filter((s) => s.length > 0);
  const pool = sets.join('');
  const length = Math.max(1, Math.floor(opts.length));
  if (pool.length === 0) return '';

  const chars: string[] = [];
  if (opts.requireEachSet) {
    for (const set of sets.slice(0, length)) {
      chars.push(set[rng(set.length)]);
    }
  }
  while (chars.length < length) {
    chars.push(pool[rng(pool.length)]);
  }
  // Fisher–Yates, otherwise the guaranteed per-set characters would always
  // occupy the first positions.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = rng(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

export function entropyBits(opts: PasswordOptions): number {
  const poolSize = buildPool(opts).length;
  if (poolSize === 0) return 0;
  return Math.round(opts.length * Math.log2(poolSize));
}

export type Strength = 'weak' | 'fair' | 'good' | 'strong';

export function strengthOf(bits: number): Strength {
  if (bits < 45) return 'weak';
  if (bits < 65) return 'fair';
  if (bits < 90) return 'good';
  return 'strong';
}
