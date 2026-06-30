import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  recordToolOpen,
  topTools,
  recentTools,
  ensureInstallMeta,
  bumpSession,
  getUsage,
  shouldShowRatingPrompt,
  totalUsage,
  RATING_MIN_DAYS,
} from './telemetry';

const fakeStore: Record<string, unknown> = {};

beforeEach(() => {
  for (const k of Object.keys(fakeStore)) delete fakeStore[k];
  const fakeChrome = {
    storage: {
      local: {
        get: vi.fn(async (key: string) =>
          fakeStore[key] !== undefined ? { [key]: fakeStore[key] } : {},
        ),
        set: vi.fn(async (entries: Record<string, unknown>) => {
          Object.assign(fakeStore, entries);
        }),
        remove: vi.fn(async (key: string) => {
          delete fakeStore[key];
        }),
      },
    },
  };
  (globalThis as unknown as { chrome: unknown }).chrome = fakeChrome;
});

afterEach(() => {
  delete (globalThis as unknown as { chrome?: unknown }).chrome;
});

describe('ensureInstallMeta', () => {
  it('creates meta on first call', async () => {
    const meta = await ensureInstallMeta('0.1.0');
    expect(meta.installId).toMatch(/.+/);
    expect(meta.version).toBe('0.1.0');
    expect(meta.installedAt).toBeGreaterThan(0);
  });
  it('returns same id on subsequent calls', async () => {
    const a = await ensureInstallMeta('0.1.0');
    const b = await ensureInstallMeta('0.1.0');
    expect(a.installId).toBe(b.installId);
  });
  it('updates version but keeps id', async () => {
    const a = await ensureInstallMeta('0.1.0');
    const b = await ensureInstallMeta('0.2.0');
    expect(b.installId).toBe(a.installId);
    expect(b.version).toBe('0.2.0');
  });
});

describe('usage tracking', () => {
  it('bumpSession increments counter', async () => {
    await bumpSession();
    await bumpSession();
    const stats = await getUsage();
    expect(stats.sessions).toBe(2);
  });

  it('recordToolOpen increments per-tool counter', async () => {
    await recordToolOpen('json', 100);
    await recordToolOpen('json', 200);
    await recordToolOpen('jwt', 150);
    const stats = await getUsage();
    expect(stats.tools).toEqual({ json: 2, jwt: 1 });
    expect(stats.lastUsed.json).toBe(200);
  });
});

describe('topTools / recentTools', () => {
  const stats = {
    sessions: 0,
    tools: { json: 5, jwt: 3, regex: 8, hash: 1 },
    lastUsed: { json: 200, jwt: 500, regex: 100, hash: 50 },
  };
  it('topTools sorts by count', () => {
    expect(topTools(stats, 2)).toEqual([
      { id: 'regex', count: 8 },
      { id: 'json', count: 5 },
    ]);
  });
  it('recentTools sorts by timestamp', () => {
    expect(recentTools(stats, 2)).toEqual([
      { id: 'jwt', ts: 500 },
      { id: 'json', ts: 200 },
    ]);
  });
  it('totalUsage sums per-tool counters', () => {
    expect(totalUsage(stats)).toBe(5 + 3 + 8 + 1);
  });
});

describe('shouldShowRatingPrompt', () => {
  const DAY = 24 * 60 * 60 * 1000;
  const NOW = 1_700_000_000_000;
  const longAgo = NOW - (RATING_MIN_DAYS + 1) * DAY;

  it('hides on fresh install (less than min days)', () => {
    expect(
      shouldShowRatingPrompt({
        installedAt: NOW - 1 * DAY,
        usageTotal: 50,
        rating: { status: 'pending' },
        now: NOW,
      }),
    ).toBe(false);
  });

  it('hides when usage below threshold', () => {
    expect(
      shouldShowRatingPrompt({
        installedAt: longAgo,
        usageTotal: 3,
        rating: { status: 'pending' },
        now: NOW,
      }),
    ).toBe(false);
  });

  it('shows when both thresholds met and pending', () => {
    expect(
      shouldShowRatingPrompt({
        installedAt: longAgo,
        usageTotal: 10,
        rating: { status: 'pending' },
        now: NOW,
      }),
    ).toBe(true);
  });

  it('hides when already rated', () => {
    expect(
      shouldShowRatingPrompt({
        installedAt: longAgo,
        usageTotal: 50,
        rating: { status: 'rated' },
        now: NOW,
      }),
    ).toBe(false);
  });

  it('hides when dismissed', () => {
    expect(
      shouldShowRatingPrompt({
        installedAt: longAgo,
        usageTotal: 50,
        rating: { status: 'dismissed' },
        now: NOW,
      }),
    ).toBe(false);
  });

  it('hides while snoozedUntil is in the future', () => {
    expect(
      shouldShowRatingPrompt({
        installedAt: longAgo,
        usageTotal: 50,
        rating: { status: 'pending', snoozedUntil: NOW + 1 * DAY },
        now: NOW,
      }),
    ).toBe(false);
  });

  it('shows again once snooze expired', () => {
    expect(
      shouldShowRatingPrompt({
        installedAt: longAgo,
        usageTotal: 50,
        rating: { status: 'pending', snoozedUntil: NOW - 1 * DAY },
        now: NOW,
      }),
    ).toBe(true);
  });
});
