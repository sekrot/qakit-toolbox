import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { exportAll, importPayload, validatePayload, clearHistory } from './backup';
import { HISTORY_KEYS } from './keys';

const fakeStore: Record<string, unknown> = {};

beforeEach(() => {
  for (const k of Object.keys(fakeStore)) delete fakeStore[k];
  const fakeChrome = {
    storage: {
      local: {
        get: vi.fn(async (keys: string[]) =>
          Object.fromEntries(keys.map((k) => [k, fakeStore[k]]).filter(([, v]) => v !== undefined)),
        ),
        set: vi.fn(async (entries: Record<string, unknown>) => {
          Object.assign(fakeStore, entries);
        }),
        remove: vi.fn(async (keys: string[]) => {
          for (const k of keys) delete fakeStore[k];
        }),
      },
    },
  };
  (globalThis as unknown as { chrome: unknown }).chrome = fakeChrome;
});

afterEach(() => {
  delete (globalThis as unknown as { chrome?: unknown }).chrome;
});

describe('validatePayload', () => {
  it('accepts well-formed payload', () => {
    expect(validatePayload({ app: 'DevKit Toolbox', version: 1, data: {} })).toBe(true);
  });
  it('rejects wrong app', () => {
    expect(validatePayload({ app: 'Other', version: 1, data: {} })).toBe(false);
  });
  it('rejects missing fields', () => {
    expect(validatePayload({})).toBe(false);
    expect(validatePayload(null)).toBe(false);
    expect(validatePayload('string')).toBe(false);
  });
});

describe('exportAll', () => {
  it('includes registered keys', async () => {
    fakeStore['devkit-settings'] = '{"theme":"dark"}';
    fakeStore['clipboard.history'] = [{ id: '1', text: 'x', pinned: false, ts: 0 }];
    const payload = await exportAll();
    expect(payload.app).toBe('DevKit Toolbox');
    expect(payload.data['devkit-settings']).toBeDefined();
    expect(payload.data['clipboard.history']).toBeDefined();
  });
});

describe('importPayload', () => {
  it('rejects invalid JSON', async () => {
    expect((await importPayload('{not json')).ok).toBe(false);
  });
  it('rejects wrong file', async () => {
    expect((await importPayload(JSON.stringify({ foo: 1 }))).ok).toBe(false);
  });
  it('imports known keys, ignores unknown', async () => {
    const file = {
      app: 'DevKit Toolbox',
      version: 1,
      data: {
        'devkit-settings': '{"theme":"light"}',
        'unknown.key': 'ignored',
      },
    };
    const result = await importPayload(JSON.stringify(file));
    expect(result.ok).toBe(true);
    expect(result.imported).toBe(1);
    expect(fakeStore['devkit-settings']).toBe('{"theme":"light"}');
    expect(fakeStore['unknown.key']).toBeUndefined();
  });
  it('reports empty file', async () => {
    const result = await importPayload(
      JSON.stringify({ app: 'DevKit Toolbox', version: 1, data: { foo: 'bar' } }),
    );
    expect(result.ok).toBe(false);
  });
});

describe('clearHistory', () => {
  it('removes only history keys', async () => {
    fakeStore['devkit-settings'] = '{"a":1}';
    for (const k of HISTORY_KEYS) fakeStore[k] = 'data';
    await clearHistory();
    expect(fakeStore['devkit-settings']).toBeDefined();
    for (const k of HISTORY_KEYS) expect(fakeStore[k]).toBeUndefined();
  });
});
