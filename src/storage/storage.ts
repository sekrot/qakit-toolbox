export type StorageArea = 'local' | 'sync';

function area(name: StorageArea) {
  return name === 'sync' ? chrome.storage.sync : chrome.storage.local;
}

export async function getValue<T>(
  key: string,
  fallback: T,
  storageArea: StorageArea = 'local',
): Promise<T> {
  const result = await area(storageArea).get(key);
  return (result[key] as T) ?? fallback;
}

export async function setValue<T>(
  key: string,
  value: T,
  storageArea: StorageArea = 'local',
): Promise<void> {
  await area(storageArea).set({ [key]: value });
}

export async function removeValue(key: string, storageArea: StorageArea = 'local'): Promise<void> {
  await area(storageArea).remove(key);
}

export function subscribe<T>(
  key: string,
  listener: (value: T | undefined) => void,
  storageArea: StorageArea = 'local',
): () => void {
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
