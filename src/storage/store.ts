import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';
export type Language = 'en' | 'de' | 'fr' | 'es' | 'ru' | 'it';

interface SettingsState {
  theme: Theme;
  language: Language | 'system';
  recentTools: string[];
  onboarded: boolean;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language | 'system') => void;
  pushRecentTool: (toolId: string) => void;
  setOnboarded: (value: boolean) => void;
}

const chromeStorage: StateStorage = {
  getItem: async (name) => {
    const result = await chrome.storage.local.get(name);
    return (result[name] as string) ?? null;
  },
  setItem: async (name, value) => {
    await chrome.storage.local.set({ [name]: value });
  },
  removeItem: async (name) => {
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
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      pushRecentTool: (toolId) =>
        set((state) => ({
          recentTools: [toolId, ...state.recentTools.filter((id) => id !== toolId)].slice(0, 10),
        })),
      setOnboarded: (value) => set({ onboarded: value }),
    }),
    {
      name: 'devkit-settings',
      storage: createJSONStorage(() => chromeStorage),
    },
  ),
);
