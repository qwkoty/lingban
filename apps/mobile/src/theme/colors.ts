export type ThemeMode = 'warm' | 'cool';

export interface ThemeColors {
  mode: ThemeMode;
  background: string;
  surface: string;
  surfaceAlt: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  text: string;
  textSecondary: string;
  textInverse: string;
  border: string;
  danger: string;
  success: string;
  shadow: string;
  inputBackground: string;
  overlay: string;
}

export const warmTheme: ThemeColors = {
  mode: 'warm',
  background: '#FFF8F5',
  surface: '#FFFFFF',
  surfaceAlt: '#FFF0EA',
  primary: '#FF8C61',
  primaryLight: '#FFB399',
  primaryDark: '#E06A40',
  text: '#2D2D2D',
  textSecondary: '#6E6E6E',
  textInverse: '#FFFFFF',
  border: '#F0E6E1',
  danger: '#E74C3C',
  success: '#27AE60',
  shadow: 'rgba(45, 29, 22, 0.08)',
  inputBackground: '#FDF6F3',
  overlay: 'rgba(45, 29, 22, 0.4)',
};

export const coolTheme: ThemeColors = {
  mode: 'cool',
  background: '#F5F9FF',
  surface: '#FFFFFF',
  surfaceAlt: '#E8F1FC',
  primary: '#4A90D9',
  primaryLight: '#93C3F5',
  primaryDark: '#3572B0',
  text: '#1F2937',
  textSecondary: '#5B6B7F',
  textInverse: '#FFFFFF',
  border: '#E1E8F0',
  danger: '#DC2626',
  success: '#16A34A',
  shadow: 'rgba(20, 35, 55, 0.08)',
  inputBackground: '#F1F6FC',
  overlay: 'rgba(20, 35, 55, 0.4)',
};

export function getTheme(mode: ThemeMode): ThemeColors {
  return mode === 'warm' ? warmTheme : coolTheme;
}

export const avatarColors = [
  '#FF8C61',
  '#4A90D9',
  '#9B59B6',
  '#27AE60',
  '#E74C3C',
  '#F39C12',
  '#1ABC9C',
  '#34495E',
];
