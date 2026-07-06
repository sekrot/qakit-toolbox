import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';
export type Language = 'en' | 'de' | 'fr' | 'es' | 'ru' | 'it';

interface SettingsState {
  theme: Theme;
  language: Language | 'system';
  recentTools: string[];
  onboarded: boolean;
  /** Tool ids hidden from the Home screen. Empty by default — everything visible. */
  hiddenTools: string[];
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language | 'system') => void;
  pushRecentTool: (toolId: string) => void;
  setOnboarded: (value: boolean) => void;
  toggleToolHidden: (toolId: string) => void;
}

// localStorage fallback keeps `vite dev` (no chrome.storage) working.
const hasChromeStorage = () => typeof chrome !== 'undefined' && !!chrome.storage?.local;

const chromeStorage: StateStorage = {
  getItem: async (name) => {
    if (!hasChromeStorage()) return localStorage.getItem(name);
    const result = await chrome.storage.local.get(name);
    return (result[name] as string) ?? null;
  },
  setItem: async (name, value) => {
    if (!hasChromeStorage()) {
      localStorage.setItem(name, value);
      return;
    }
    await chrome.storage.local.set({ [name]: value });
  },
  removeItem: async (name) => {
    if (!hasChromeStorage()) {
      localStorage.removeItem(name);
      return;
    }
    await chrome.storage.local.remove(name);
  },
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      language: 'system',
      recentTools: [],
      onboarded: false,
      hiddenTools: [],
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      pushRecentTool: (toolId) =>
        set((state) => ({
          recentTools: [toolId, ...state.recentTools.filter((id) => id !== toolId)].slice(0, 10),
        })),
      setOnboarded: (value) => set({ onboarded: value }),
      toggleToolHidden: (toolId) =>
        set((state) => ({
          hiddenTools: state.hiddenTools.includes(toolId)
            ? state.hiddenTools.filter((id) => id !== toolId)
            : [...state.hiddenTools, toolId],
        })),
    }),
    {
      name: 'devkit-settings',
      storage: createJSONStorage(() => chromeStorage),
    },
  ),
);
