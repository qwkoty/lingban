// 灵伴 - 深色极光主题系统
// 整体以深色背景为主，搭配七彩渐变光晕

export type AccentKey = 'aurora' | 'blue' | 'cyan' | 'green' | 'amber' | 'pink' | 'violet';

export interface AccentPreset {
  key: AccentKey;
  label: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  glow: string; // rgba glow color
  gradient: [string, string, string];
}

// 七彩渐变色系 — 蓝、青、绿、黄、橙、粉、紫
export const ACCENTS: Record<AccentKey, AccentPreset> = {
  aurora: {
    key: 'aurora',
    label: '极光',
    primary: '#6EE7FF',
    primaryLight: '#A5F3FF',
    primaryDark: '#22D3EE',
    glow: 'rgba(34, 211, 238, 0.25)',
    gradient: ['#4A9EFF', '#22D3EE', '#34D399'],
  },
  blue: {
    key: 'blue',
    label: '蓝',
    primary: '#60A5FA',
    primaryLight: '#93C5FD',
    primaryDark: '#3B82F6',
    glow: 'rgba(59, 130, 246, 0.25)',
    gradient: ['#3B82F6', '#60A5FA', '#93C5FD'],
  },
  cyan: {
    key: 'cyan',
    label: '青',
    primary: '#22D3EE',
    primaryLight: '#67E8F9',
    primaryDark: '#06B6D4',
    glow: 'rgba(34, 211, 238, 0.25)',
    gradient: ['#06B6D4', '#22D3EE', '#67E8F9'],
  },
  green: {
    key: 'green',
    label: '绿',
    primary: '#34D399',
    primaryLight: '#6EE7B7',
    primaryDark: '#10B981',
    glow: 'rgba(52, 211, 153, 0.25)',
    gradient: ['#10B981', '#34D399', '#6EE7B7'],
  },
  amber: {
    key: 'amber',
    label: '橙',
    primary: '#FBBF24',
    primaryLight: '#FCD34D',
    primaryDark: '#F59E0B',
    glow: 'rgba(251, 191, 36, 0.25)',
    gradient: ['#F59E0B', '#FBBF24', '#FCD34D'],
  },
  pink: {
    key: 'pink',
    label: '粉',
    primary: '#F472B6',
    primaryLight: '#F9A8D4',
    primaryDark: '#EC4899',
    glow: 'rgba(244, 114, 182, 0.25)',
    gradient: ['#EC4899', '#F472B6', '#F9A8D4'],
  },
  violet: {
    key: 'violet',
    label: '紫',
    primary: '#A78BFA',
    primaryLight: '#C4B5FD',
    primaryDark: '#8B5CF6',
    glow: 'rgba(167, 139, 250, 0.25)',
    gradient: ['#8B5CF6', '#A78BFA', '#C4B5FD'],
  },
};

// 彩虹渐变色带 — 用于主题选择器
export const RAINBOW_GRADIENT: string[] = [
  '#4A9EFF', // 蓝
  '#22D3EE', // 青
  '#34D399', // 绿
  '#FBBF24', // 黄
  '#FB923C', // 橙
  '#F472B6', // 粉
  '#A78BFA', // 紫
];

export interface ThemeColors {
  accent: AccentKey;
  // 背景层
  background: string;
  backgroundAlt: string;
  // 玻璃卡片
  surface: string; // rgba 半透明
  surfaceAlt: string;
  surfaceSolid: string; // 不透明备用
  // 主色
  primary: string;
  primaryLight: string;
  primaryDark: string;
  glow: string;
  gradient: [string, string, string];
  // 文字
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  // 边框
  border: string;
  borderStrong: string;
  // 功能色
  danger: string;
  success: string;
  // 阴影
  shadow: string;
  // 输入
  inputBackground: string;
  // 遮罩
  overlay: string;
}

export function getThemeColors(accent: AccentKey): ThemeColors {
  const a = ACCENTS[accent];
  return {
    accent,
    background: '#0A0A0F',
    backgroundAlt: '#121218',
    surface: 'rgba(255, 255, 255, 0.06)',
    surfaceAlt: 'rgba(255, 255, 255, 0.04)',
    surfaceSolid: '#1A1A24',
    primary: a.primary,
    primaryLight: a.primaryLight,
    primaryDark: a.primaryDark,
    glow: a.glow,
    gradient: a.gradient,
    text: '#F5F5F7',
    textSecondary: 'rgba(235, 235, 245, 0.6)',
    textTertiary: 'rgba(235, 235, 245, 0.35)',
    textInverse: '#0A0A0F',
    border: 'rgba(255, 255, 255, 0.08)',
    borderStrong: 'rgba(255, 255, 255, 0.14)',
    danger: '#FF6B6B',
    success: '#34D399',
    shadow: 'rgba(0, 0, 0, 0.4)',
    inputBackground: 'rgba(255, 255, 255, 0.05)',
    overlay: 'rgba(0, 0, 0, 0.6)',
  };
}

// 头像渐变色 — 用于智能体头像
export const avatarGradients: { id: string; label: string; colors: [string, string] }[] = [
  { id: 'aurora', label: '极光', colors: ['#4A9EFF', '#22D3EE'] },
  { id: 'sunset', label: '日落', colors: ['#F59E0B', '#F472B6'] },
  { id: 'forest', label: '森林', colors: ['#34D399', '#10B981'] },
  { id: 'lavender', label: '薰衣草', colors: ['#A78BFA', '#F472B6'] },
  { id: 'ocean', label: '海洋', colors: ['#3B82F6', '#06B6D4'] },
  { id: 'peach', label: '蜜桃', colors: ['#FB923C', '#FBBF24'] },
  { id: 'rose', label: '玫瑰', colors: ['#F472B6', '#FB7185'] },
  { id: 'mint', label: '薄荷', colors: ['#34D399', '#22D3EE'] },
  { id: 'gold', label: '金', colors: ['#FBBF24', '#F59E0B'] },
  { id: 'iris', label: '鸢尾', colors: ['#8B5CF6', '#6366F1'] },
];
