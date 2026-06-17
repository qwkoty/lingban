import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { BotIcon } from './icons';

interface Props {
  name: string;
  color?: string | null;
  size?: number;
  showIcon?: boolean;
}

export function AvatarCircle({ name, color, size = 48, showIcon = true }: Props) {
  const { colors } = useTheme();
  const bg = color || colors.primary;
  const initial = name?.charAt(0)?.toUpperCase() || 'A';
  const fontSize = size * 0.45;

  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
      ]}
    >
      {showIcon ? (
        <BotIcon size={size * 0.55} color="#FFFFFF" />
      ) : (
        <Text style={[styles.initial, { fontSize, color: '#FFFFFF' }]}>{initial}</Text>
      )}
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
