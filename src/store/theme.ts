import { create } from 'zustand';
import type { Theme } from '../types.js';

const THEME_KEY = 'lingban_theme';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  initTheme: (theme?: Theme) => void;
}

function applyTheme(theme: Theme) {
  document.body.classList.remove('theme-aurora', 'theme-colorful');
  document.body.classList.add(`theme-${theme}`);
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: (localStorage.getItem(THEME_KEY) as Theme) || 'aurora',

  setTheme: (theme) => {
    localStorage.setItem(THEME_KEY, theme);
    applyTheme(theme);
    set({ theme });
  },

  initTheme: (theme) => {
    const resolved = theme || (localStorage.getItem(THEME_KEY) as Theme) || 'aurora';
    localStorage.setItem(THEME_KEY, resolved);
    applyTheme(resolved);
    set({ theme: resolved });
  },
}));
