import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'theme-store' });

const mmkvStorage = {
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => storage.delete(name),
};

interface ThemeState {
  mode: 'light' | 'dark' | 'system';
  customPrimary: string | null;
  customSecondary: string | null;
  customAccent: string | null;
  setMode: (mode: 'light' | 'dark' | 'system') => void;
  setCustomColors: (primary: string | null, secondary: string | null, accent: string | null) => void;
  resetColors: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'system',
      customPrimary: null,
      customSecondary: null,
      customAccent: null,
      setMode: (mode) => set({ mode }),
      setCustomColors: (customPrimary, customSecondary, customAccent) =>
        set({ customPrimary, customSecondary, customAccent }),
      resetColors: () =>
        set({ customPrimary: null, customSecondary: null, customAccent: null }),
    }),
    {
      name: 'theme-store',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
