import { create } from 'zustand';

type ThemeName = 'aurora' | 'colorful';

const THEME_KEY = 'lingban_theme';

function applyTheme(theme: ThemeName) {
  document.body.className = `theme-${theme}`;
}

function getInitialTheme(): ThemeName {
  const saved = localStorage.getItem(THEME_KEY) as ThemeName | null;
  return saved === 'colorful' ? 'colorful' : 'aurora';
}

interface ThemeState {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  toggle: () => void;
  init: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'aurora',

  init: () => {
    const theme = getInitialTheme();
    applyTheme(theme);
    set({ theme });
  },

  setTheme: (theme) => {
    localStorage.setItem(THEME_KEY, theme);
    applyTheme(theme);
    set({ theme });
  },

  toggle: () => {
    const next = get().theme === 'aurora' ? 'colorful' : 'aurora';
    get().setTheme(next);
  },
}));
