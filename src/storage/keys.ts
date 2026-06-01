/**
 * Registry of chrome.storage.local keys the extension owns.
 * Used by settings export/import and "clear history" flows.
 */
export const STORAGE_KEYS = {
  settings: 'devkit-settings',
  clipboardHistory: 'clipboard.history',
  colorPickerHistory: 'colorpicker.history',
  installMeta: 'devkit-install',
  usage: 'devkit-usage',
} as const;

/** Keys considered "history" — wiped by the Clear-history button.
 *  Telemetry counters are also reset so users can opt out of local stats. */
export const HISTORY_KEYS: string[] = [
  STORAGE_KEYS.clipboardHistory,
  STORAGE_KEYS.colorPickerHistory,
  STORAGE_KEYS.usage,
];

/** All keys included in export. */
export const EXPORT_KEYS: string[] = Object.values(STORAGE_KEYS);
