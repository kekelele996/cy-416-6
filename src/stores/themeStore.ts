import { create } from 'zustand';
import { THEME_LABELS, THEME_TOKENS, type ThemeMode } from '@/constants/themes';
import { STORAGE_KEYS, readCollection, writeCollection } from '@/utils/storage';

interface ThemeState {
  mode: ThemeMode;
  tokens: typeof THEME_TOKENS.light;
  hydrated: boolean;
  initialize: () => Promise<void>;
  toggle: () => Promise<void>;
  setMode: (mode: ThemeMode) => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'light',
  tokens: THEME_TOKENS.light,
  hydrated: false,
  async initialize() {
    const mode = await readCollection<ThemeMode>(STORAGE_KEYS.theme, 'light');
    set({ mode, tokens: THEME_TOKENS[mode], hydrated: true });
    document.documentElement.dataset.theme = mode;
  },
  async toggle() {
    const nextMode = get().mode === 'light' ? 'dark' : 'light';
    await get().setMode(nextMode);
  },
  async setMode(mode) {
    await writeCollection(STORAGE_KEYS.theme, mode);
    set({ mode, tokens: THEME_TOKENS[mode] });
    document.documentElement.dataset.theme = mode;
    document.documentElement.setAttribute('aria-label', `当前主题：${THEME_LABELS[mode]}`);
  },
}));
