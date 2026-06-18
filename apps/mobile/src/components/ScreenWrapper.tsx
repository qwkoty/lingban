import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';

export function ScreenWrapper({ children, style }: { children: React.ReactNode; style?: any }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      {/* 极光渐变背景 */}
      <LinearGradient
        colors={[colors.background, colors.backgroundAlt, colors.background]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      {/* 顶部光晕 */}
      <LinearGradient
        colors={[colors.glow, 'transparent']}
        style={[styles.glow, { top: -100 }]}
        pointerEvents="none"
      />
      {/* 底部光晕 */}
      <LinearGradient
        colors={['transparent', colors.glow]}
        style={[styles.glow, { bottom: -100 }]}
        pointerEvents="none"
      />
      <View style={[styles.content, { paddingTop: insets.top }, style]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
  glow: {
    position: 'absolute',
    left: -80,
    right: -80,
    height: 300,
    opacity: 0.5,
  },
});
