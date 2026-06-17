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
  background: '#FFF5F0',
  surface: '#FFFFFF',
  surfaceAlt: '#FFEDE6',
  primary: '#F26B4F',
  primaryLight: '#FFAB99',
  primaryDark: '#C9523A',
  text: '#1A1A1A',
  textSecondary: '#7A7A7A',
  textInverse: '#FFFFFF',
  border: '#F2E3DC',
  danger: '#E53935',
  success: '#2E7D32',
  shadow: 'rgba(45, 25, 18, 0.06)',
  inputBackground: '#FDF7F5',
  overlay: 'rgba(26, 26, 26, 0.35)',
};

export const coolTheme: ThemeColors = {
  mode: 'cool',
  background: '#F0F7FF',
  surface: '#FFFFFF',
  surfaceAlt: '#E6F0FA',
  primary: '#3B82F6',
  primaryLight: '#93C5FD',
  primaryDark: '#2563EB',
  text: '#0F172A',
  textSecondary: '#64748B',
  textInverse: '#FFFFFF',
  border: '#E2E8F0',
  danger: '#DC2626',
  success: '#16A34A',
  shadow: 'rgba(15, 23, 42, 0.06)',
  inputBackground: '#F8FAFC',
  overlay: 'rgba(15, 23, 42, 0.35)',
};

export function getTheme(mode: ThemeMode): ThemeColors {
  return mode === 'warm' ? warmTheme : coolTheme;
}

export const avatarColors = [
  '#F26B4F',
  '#3B82F6',
  '#8B5CF6',
  '#10B981',
  '#EF4444',
  '#F59E0B',
  '#06B6D4',
  '#475569',
];
