import { EXPORT_KEYS, HISTORY_KEYS } from './keys';

const EXPORT_VERSION = 1;

export interface ExportPayload {
  app: 'DevKit Toolbox';
  version: number;
  exportedAt: string;
  data: Record<string, unknown>;
}

export async function exportAll(): Promise<ExportPayload> {
  const data = await chrome.storage.local.get(EXPORT_KEYS);
  return {
    app: 'DevKit Toolbox',
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  };
}

export async function downloadExport(): Promise<void> {
  const payload = await exportAll();
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `devkit-settings-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export interface ImportResult {
  ok: boolean;
  imported?: number;
  error?: string;
}

export function validatePayload(value: unknown): value is ExportPayload {
  if (!value || typeof value !== 'object') return false;
  const p = value as Partial<ExportPayload>;
  return (
    p.app === 'DevKit Toolbox' &&
    typeof p.version === 'number' &&
    typeof p.data === 'object' &&
    p.data !== null
  );
}

export async function importPayload(raw: string): Promise<ImportResult> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    return { ok: false, error: `Invalid JSON: ${e instanceof Error ? e.message : String(e)}` };
  }
  if (!validatePayload(parsed)) {
    return { ok: false, error: 'Not a DevKit Toolbox backup file' };
  }
  const entries = Object.entries(parsed.data).filter(([key]) => EXPORT_KEYS.includes(key));
  if (entries.length === 0) return { ok: false, error: 'No known settings in file' };
  await chrome.storage.local.set(Object.fromEntries(entries));
  return { ok: true, imported: entries.length };
}

export async function clearHistory(): Promise<void> {
  await chrome.storage.local.remove(HISTORY_KEYS);
}
