import { describe, expect, it } from 'vitest';
import { parseTimestamp, parseDate, detectUnit, formatInTimezone, getRelative } from './logic';

describe('parseTimestamp', () => {
  it('parses seconds', () => {
    const r = parseTimestamp('1700000000', 's');
    expect(r.ok).toBe(true);
    expect(r.date?.toISOString()).toBe('2023-11-14T22:13:20.000Z');
  });
  it('parses milliseconds', () => {
    const r = parseTimestamp('1700000000000', 'ms');
    expect(r.date?.toISOString()).toBe('2023-11-14T22:13:20.000Z');
  });
  it('rejects non-integer', () => {
    expect(parseTimestamp('12.5', 's').ok).toBe(false);
    expect(parseTimestamp('abc', 's').ok).toBe(false);
  });
  it('rejects empty', () => {
    expect(parseTimestamp('', 's').ok).toBe(false);
  });
});

describe('parseDate', () => {
  it('parses ISO 8601', () => {
    const r = parseDate('2023-11-14T22:13:20Z');
    expect(r.date?.getTime()).toBe(1700000000000);
  });
  it('rejects gibberish', () => {
    expect(parseDate('not a date').ok).toBe(false);
  });
});

describe('detectUnit', () => {
  it('detects seconds for small numbers', () => {
    expect(detectUnit('1700000000')).toBe('s');
  });
  it('detects milliseconds for 13-digit numbers', () => {
    expect(detectUnit('1700000000000')).toBe('ms');
  });
});

describe('formatInTimezone', () => {
  it('formats in UTC', () => {
    const d = new Date('2023-11-14T22:13:20Z');
    expect(formatInTimezone(d, 'UTC')).toBe('2023-11-14 22:13:20');
  });
  it('formats in named timezone', () => {
    const d = new Date('2023-11-14T22:13:20Z');
    expect(formatInTimezone(d, 'America/New_York')).toMatch(/2023-11-14 17:13:20/);
  });
});

describe('getRelative', () => {
  const now = new Date('2024-01-01T00:00:00Z').getTime();
  it('handles past', () => {
    const d = new Date(now - 5 * 60 * 1000);
    expect(getRelative(d, now)).toMatch(/5 min|minutes ago/);
  });
  it('handles future', () => {
    const d = new Date(now + 3 * 86400 * 1000);
    expect(getRelative(d, now)).toMatch(/in 3 day|days/);
  });
});
