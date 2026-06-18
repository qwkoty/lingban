import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AccentKey, ThemeColors, getThemeColors } from './colors';

const THEME_STORAGE_KEY = '@lingban:accent';

interface ThemeContextValue {
  accent: AccentKey;
  colors: ThemeColors;
  setAccent: (accent: AccentKey) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [accent, setAccentState] = useState<AccentKey>('aurora');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((stored) => {
        if (stored && ['aurora', 'blue', 'cyan', 'green', 'amber', 'pink', 'violet'].includes(stored)) {
          setAccentState(stored as AccentKey);
        }
      })
      .finally(() => setReady(true));
  }, []);

  const setAccent = async (next: AccentKey) => {
    setAccentState(next);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, next);
  };

  if (!ready) return null;

  return (
    <ThemeContext.Provider value={{ accent, colors: getThemeColors(accent), setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
