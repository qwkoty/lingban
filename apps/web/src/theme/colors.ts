export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  inputBackground: string;
  primary: string;
  text: string;
  textInverse: string;
  textSecondary: string;
  border: string;
  shadow: string;
  danger: string;
  gradient: [string, string];
}

export const ACCENTS: Record<string, { label: string; gradient: [string, string]; primary: string }> = {
  aurora: { label: '极光', gradient: ['#FF6B9D', '#C44569'], primary: '#FF6B9D' },
  blue: { label: '深海', gradient: ['#4FACFE', '#00F2FE'], primary: '#4FACFE' },
  cyan: { label: '冰川', gradient: ['#43E97B', '#38F9D7'], primary: '#43E97B' },
  green: { label: '森林', gradient: ['#11998E', '#38EF7D'], primary: '#11998E' },
  amber: { label: '暖阳', gradient: ['#F6D365', '#FDA085'], primary: '#F6D365' },
  pink: { label: '樱花', gradient: ['#FF9A9E', '#FECFEF'], primary: '#FF9A9E' },
  violet: { label: '紫晶', gradient: ['#A18CD1', '#FBC2EB'], primary: '#A18CD1' },
};

export type AccentKey = keyof typeof ACCENTS;

export function getColors(accent: AccentKey): ThemeColors {
  const preset = ACCENTS[accent];
  return {
    background: '#0a0a0f',
    surface: 'rgba(255,255,255,0.06)',
    surfaceAlt: 'rgba(255,255,255,0.04)',
    inputBackground: 'rgba(255,255,255,0.05)',
    primary: preset.primary,
    text: '#f0f0f5',
    textInverse: '#0a0a0f',
    textSecondary: 'rgba(240,240,245,0.5)',
    border: 'rgba(255,255,255,0.08)',
    shadow: 'rgba(0,0,0,0.4)',
    danger: '#ff6b6b',
    gradient: preset.gradient,
  };
}

export const avatarGradients = [
  { id: 'aurora', colors: ['#FF6B9D', '#C44569'] as [string, string] },
  { id: 'blue', colors: ['#4FACFE', '#00F2FE'] as [string, string] },
  { id: 'cyan', colors: ['#43E97B', '#38F9D7'] as [string, string] },
  { id: 'green', colors: ['#11998E', '#38EF7D'] as [string, string] },
  { id: 'amber', colors: ['#F6D365', '#FDA085'] as [string, string] },
  { id: 'pink', colors: ['#FF9A9E', '#FECFEF'] as [string, string] },
  { id: 'violet', colors: ['#A18CD1', '#FBC2EB'] as [string, string] },
  { id: 'rose', colors: ['#F093FB', '#F5576C'] as [string, string] },
  { id: 'ocean', colors: ['#30CFD0', '#330867'] as [string, string] },
  { id: 'sunset', colors: ['#FA709A', '#FEE140'] as [string, string] },
];
