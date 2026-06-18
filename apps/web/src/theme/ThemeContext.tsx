import { useState, useEffect } from 'react';
import { ThemeContext } from './theme-context';
import { getColors } from './colors';
import type { AccentKey } from './colors';

const STORAGE_KEY = 'lingban:accent';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [accent, setAccentState] = useState<AccentKey>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored as AccentKey) || 'aurora';
  });

  const setAccent = (a: AccentKey) => {
    setAccentState(a);
    localStorage.setItem(STORAGE_KEY, a);
  };

  const colors = getColors(accent);

  useEffect(() => {
    document.body.style.backgroundColor = colors.background;
    document.body.style.color = colors.text;
  }, [colors]);

  return (
    <ThemeContext.Provider value={{ accent, colors, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}
