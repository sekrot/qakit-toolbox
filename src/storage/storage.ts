export type StorageArea = 'local' | 'sync';

// Outside the extension context (`vite dev` on localhost) chrome.storage does
// not exist — fall back to localStorage so screens still render during
// development. Change subscriptions are a no-op there.
function hasChromeStorage(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.storage?.local;
}

function area(name: StorageArea) {
  return name === 'sync' ? chrome.storage.sync : chrome.storage.local;
}

export async function getValue<T>(
  key: string,
  fallback: T,
  storageArea: StorageArea = 'local',
): Promise<T> {
  if (!hasChromeStorage()) {
    const raw = localStorage.getItem(key);
    return raw !== null ? (JSON.parse(raw) as T) : fallback;
  }
  const result = await area(storageArea).get(key);
  return (result[key] as T) ?? fallback;
}

export async function setValue<T>(
  key: string,
  value: T,
  storageArea: StorageArea = 'local',
): Promise<void> {
  if (!hasChromeStorage()) {
    localStorage.setItem(key, JSON.stringify(value));
    return;
  }
  await area(storageArea).set({ [key]: value });
}

export async function removeValue(key: string, storageArea: StorageArea = 'local'): Promise<void> {
  if (!hasChromeStorage()) {
    localStorage.removeItem(key);
    return;
  }
  await area(storageArea).remove(key);
}

export function subscribe<T>(
  key: string,
  listener: (value: T | undefined) => void,
  storageArea: StorageArea = 'local',
): () => void {
  if (!hasChromeStorage()) return () => {};
  const handler = (
    changes: Record<string, chrome.storage.StorageChange>,
    areaName: chrome.storage.AreaName,
  ) => {
    if (areaName !== storageArea) return;
    if (Object.prototype.hasOwnProperty.call(changes, key)) {
      listener(changes[key].newValue as T | undefined);
    }
  };
  chrome.storage.onChanged.addListener(handler);
  return () => chrome.storage.onChanged.removeListener(handler);
}
