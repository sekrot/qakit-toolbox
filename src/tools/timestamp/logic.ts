export type Unit = 's' | 'ms';

export interface ParseResult {
  ok: boolean;
  date?: Date;
  error?: string;
}

export function parseTimestamp(input: string, unit: Unit): ParseResult {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, error: 'Empty input' };
  if (!/^-?\d+$/.test(trimmed)) return { ok: false, error: 'Not an integer' };
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return { ok: false, error: 'Out of range' };
  const ms = unit === 's' ? n * 1000 : n;
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return { ok: false, error: 'Invalid date' };
  return { ok: true, date };
}

export function parseDate(input: string): ParseResult {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, error: 'Empty input' };
  const ms = Date.parse(trimmed);
  if (Number.isNaN(ms)) return { ok: false, error: 'Could not parse date' };
  return { ok: true, date: new Date(ms) };
}

export function detectUnit(input: string): Unit {
  const n = Number(input.trim());
  if (!Number.isFinite(n)) return 's';
  return Math.abs(n) >= 1e12 ? 'ms' : 's';
}

export function formatInTimezone(date: Date, timeZone: string): string {
  try {
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const parts = fmt.formatToParts(date);
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
    return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`;
  } catch {
    return date.toISOString();
  }
}

export function getRelative(date: Date, now: number = Date.now()): string {
  const diffSec = Math.round((date.getTime() - now) / 1000);
  const abs = Math.abs(diffSec);
  const fmt = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  if (abs < 60) return fmt.format(diffSec, 'second');
  if (abs < 3600) return fmt.format(Math.round(diffSec / 60), 'minute');
  if (abs < 86400) return fmt.format(Math.round(diffSec / 3600), 'hour');
  if (abs < 2592000) return fmt.format(Math.round(diffSec / 86400), 'day');
  if (abs < 31536000) return fmt.format(Math.round(diffSec / 2592000), 'month');
  return fmt.format(Math.round(diffSec / 31536000), 'year');
}
