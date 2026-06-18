import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { BotIcon } from './icons';
import { avatarGradients } from '../theme/colors';

interface Props {
  name: string;
  color?: string | null;
  size?: number;
  showIcon?: boolean;
}

// 根据 color 值查找渐变色，支持旧版纯色值
function resolveGradient(color?: string | null): [string, string] | null {
  if (!color) return null;
  // 检查是否是 avatarGradients 的 id
  const found = avatarGradients.find((g) => g.id === color);
  if (found) return found.colors;
  // 检查是否是 # 开头的颜色（旧版纯色）
  if (color.startsWith('#')) {
    return [color, color];
  }
  return null;
}

export function AvatarCircle({ name, color, size = 48, showIcon = true }: Props) {
  const { colors } = useTheme();
  const gradient = resolveGradient(color);
  const bg = gradient ? undefined : (color || colors.primary);
  const initial = name?.charAt(0)?.toUpperCase() || 'A';
  const fontSize = size * 0.45;

  const content = showIcon ? (
    <BotIcon size={size * 0.55} color="#FFFFFF" />
  ) : (
    <Text style={[styles.initial, { fontSize, color: '#FFFFFF' }]}>{initial}</Text>
  );

  if (gradient) {
    return (
      <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}
        >
          {content}
        </LinearGradient>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
      ]}
    >
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontWeight: '700',
  },
});
