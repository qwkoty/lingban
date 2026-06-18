import { createContext } from 'react';
import type { AccentKey, ThemeColors } from './colors';

interface ThemeContextValue {
  accent: AccentKey;
  colors: ThemeColors;
  setAccent: (a: AccentKey) => void;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
