import { create } from 'zustand';
import type { Theme } from '../types';

const THEME_KEY = 'lingban_theme';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  initTheme: (theme?: Theme) => void;
}

function getStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem(THEME_KEY);
    if (value === 'aurora' || value === 'colorful') return value;
    return null;
  } catch {
    return null;
  }
}

function setStoredTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // ignore
  }
}

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  document.body.classList.remove('theme-aurora', 'theme-colorful');
  document.body.classList.add(`theme-${theme}`);
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getStoredTheme() || 'aurora',

  setTheme: (theme) => {
    setStoredTheme(theme);
    applyTheme(theme);
    set({ theme });
  },

  initTheme: (theme) => {
    const resolved = theme || getStoredTheme() || 'aurora';
    setStoredTheme(resolved);
    applyTheme(resolved);
    set({ theme: resolved });
  },
}));
