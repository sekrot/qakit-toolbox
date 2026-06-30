import { getValue, setValue } from './storage';

const INSTALL_KEY = 'devkit-install';
const USAGE_KEY = 'devkit-usage';
const RATING_KEY = 'devkit-rating-prompt';

export const RATING_MIN_DAYS = 7;
export const RATING_MIN_USES = 10;
export const RATING_SNOOZE_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface InstallMeta {
  installId: string;
  installedAt: number;
  version: string;
}

export interface UsageStats {
  /** Total launches of the side panel (background tracks this). */
  sessions: number;
  /** Per-tool open count, keyed by tool id. */
  tools: Record<string, number>;
  /** Last-open timestamp per tool, keyed by tool id. */
  lastUsed: Record<string, number>;
}

const EMPTY_USAGE: UsageStats = { sessions: 0, tools: {}, lastUsed: {} };

export async function ensureInstallMeta(version: string): Promise<InstallMeta> {
  const existing = await getValue<InstallMeta | null>(INSTALL_KEY, null);
  if (existing && existing.installId) {
    if (existing.version === version) return existing;
    const updated = { ...existing, version };
    await setValue(INSTALL_KEY, updated);
    return updated;
  }
  const meta: InstallMeta = {
    installId: makeId(),
    installedAt: Date.now(),
    version,
  };
  await setValue(INSTALL_KEY, meta);
  return meta;
}

export async function bumpSession(): Promise<void> {
  const current = await getValue<UsageStats>(USAGE_KEY, EMPTY_USAGE);
  await setValue(USAGE_KEY, { ...current, sessions: current.sessions + 1 });
}

export async function recordToolOpen(
  toolId: string,
  now: number = Date.now(),
): Promise<UsageStats> {
  const current = await getValue<UsageStats>(USAGE_KEY, EMPTY_USAGE);
  const next: UsageStats = {
    sessions: current.sessions,
    tools: { ...current.tools, [toolId]: (current.tools[toolId] ?? 0) + 1 },
    lastUsed: { ...current.lastUsed, [toolId]: now },
  };
  await setValue(USAGE_KEY, next);
  return next;
}

export async function getUsage(): Promise<UsageStats> {
  return getValue<UsageStats>(USAGE_KEY, EMPTY_USAGE);
}

export function topTools(stats: UsageStats, limit = 4): { id: string; count: number }[] {
  return Object.entries(stats.tools)
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export type RatingPromptStatus = 'pending' | 'rated' | 'dismissed';

export interface RatingPromptState {
  status: RatingPromptStatus;
  snoozedUntil?: number;
}

const EMPTY_RATING: RatingPromptState = { status: 'pending' };

export async function getRatingPrompt(): Promise<RatingPromptState> {
  return getValue<RatingPromptState>(RATING_KEY, EMPTY_RATING);
}

export async function setRatingPrompt(next: RatingPromptState): Promise<void> {
  await setValue(RATING_KEY, next);
}

export function totalUsage(stats: UsageStats): number {
  return Object.values(stats.tools).reduce((sum, n) => sum + n, 0);
}

export function shouldShowRatingPrompt(args: {
  installedAt: number;
  usageTotal: number;
  rating: RatingPromptState;
  now: number;
}): boolean {
  const { installedAt, usageTotal, rating, now } = args;
  if (rating.status !== 'pending') return false;
  if (rating.snoozedUntil && rating.snoozedUntil > now) return false;
  if (now - installedAt < RATING_MIN_DAYS * DAY_MS) return false;
  if (usageTotal < RATING_MIN_USES) return false;
  return true;
}

export function recentTools(stats: UsageStats, limit = 4): { id: string; ts: number }[] {
  return Object.entries(stats.lastUsed)
    .map(([id, ts]) => ({ id, ts }))
    .sort((a, b) => b.ts - a.ts)
    .slice(0, limit);
}

function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

export const TELEMETRY_KEYS = [INSTALL_KEY, USAGE_KEY, RATING_KEY] as const;
