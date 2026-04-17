import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'chat-draft-store' });

const mmkvStorage = {
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => storage.delete(name),
};

interface ChatDraftState {
  drafts: Record<string, string>;
  setDraft: (key: string, text: string) => void;
  getDraft: (key: string) => string;
  clearDraft: (key: string) => void;
}

export const useChatDraftStore = create<ChatDraftState>()(
  persist(
    (set, get) => ({
      drafts: {},
      setDraft: (key, text) =>
        set((state) => ({
          drafts: { ...state.drafts, [key]: text },
        })),
      getDraft: (key) => get().drafts[key] ?? '',
      clearDraft: (key) =>
        set((state) => {
          const { [key]: _, ...rest } = state.drafts;
          return { drafts: rest };
        }),
    }),
    {
      name: 'chat-draft-store',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
