import { create } from 'zustand';
import type { ThemeType } from '@/types';

interface ThemeState {
  theme: ThemeType;
  init: () => void;
  setTheme: (theme: ThemeType) => void;
  toggleTheme: () => void;
}

const THEME_KEY = 'lingban_theme';

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'aurora',

  init: () => {
    if (typeof window === 'undefined') return;

    const saved = localStorage.getItem(THEME_KEY) as ThemeType | null;
    const theme = saved || 'aurora';
    set({ theme });
    applyTheme(theme);
  },

  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_KEY, theme);
    }
    applyTheme(theme);
    set({ theme });
  },

  toggleTheme: () => {
    const current = get().theme;
    const next: ThemeType = current === 'aurora' ? 'dark' : 'aurora';
    get().setTheme(next);
  },
}));

function applyTheme(theme: ThemeType) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
}
