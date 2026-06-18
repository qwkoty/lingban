import React, { useEffect, useRef } from 'react';
import {
  Animated,
  View,
  TouchableOpacity,
  TouchableOpacityProps,
  StyleSheet,
  Easing,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';

// 逐个淡入上滑
interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  translateY?: number;
  style?: ViewStyle;
}

export function FadeIn({ children, delay = 0, duration = 400, translateY = 16, style }: FadeInProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(translateY)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration, delay, useNativeDriver: true }),
      Animated.timing(translate, {
        toValue: 0,
        duration,
        delay,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY: translate }] }, style]}>
      {children}
    </Animated.View>
  );
}

// 弹性按压
interface ScalePressProps extends TouchableOpacityProps {
  children?: React.ReactNode;
  scale?: number;
  style?: StyleProp<ViewStyle>;
}

export function ScalePress({ children, scale = 0.96, style, onPressIn, onPressOut, ...rest }: ScalePressProps) {
  const anim = useRef(new Animated.Value(1)).current;

  const pressIn = (e: any) => {
    Animated.spring(anim, { toValue: scale, useNativeDriver: true, friction: 5 }).start();
    onPressIn?.(e);
  };
  const pressOut = (e: any) => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, friction: 3, tension: 200 }).start();
    onPressOut?.(e);
  };

  return (
    <TouchableOpacity activeOpacity={0.9} onPressIn={pressIn} onPressOut={pressOut} {...rest}>
      <Animated.View style={[{ transform: [{ scale: anim }] }, style]}>{children}</Animated.View>
    </TouchableOpacity>
  );
}

// 列表逐个进入
export function StaggerContainer({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={style}>{children}</View>;
}

export function StaggerItem({
  children,
  index,
  style,
}: {
  children: React.ReactNode;
  index: number;
  style?: ViewStyle;
}) {
  return <FadeIn delay={index * 60} duration={350} translateY={12} style={style}>{children}</FadeIn>;
}

// 呼吸动画
export function PulsingFAB({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const scale = useRef(new Animated.Value(1)).current;
  const { colors } = useTheme();

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.04, duration: 1500, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(scale, { toValue: 1, duration: 1500, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return <Animated.View style={[{ transform: [{ scale }] }, style]}>{children}</Animated.View>;
}

// 打字指示器
export function TypingIndicator({ color }: { color: string }) {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    const anims = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 400, useNativeDriver: true }),
        ])
      )
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, []);

  return (
    <View style={styles.typingRow}>
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={[
            styles.dot,
            { backgroundColor: color },
            {
              opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
              transform: [
                {
                  translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

// 现代开关
export function AnimatedSwitch({
  value,
  onValueChange,
  activeColor,
  inactiveColor,
}: {
  value: boolean;
  onValueChange: (v: boolean) => void;
  activeColor: string;
  inactiveColor: string;
}) {
  const translate = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(translate, { toValue: value ? 1 : 0, useNativeDriver: false, friction: 8 }).start();
  }, [value]);

  const backgroundColor = translate.interpolate({
    inputRange: [0, 1],
    outputRange: [inactiveColor, activeColor],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onValueChange(!value)}
      style={{ justifyContent: 'center' }}
    >
      <Animated.View style={[styles.track, { backgroundColor }]}>
        <Animated.View
          style={[
            styles.thumb,
            {
              transform: [
                {
                  translateX: translate.interpolate({ inputRange: [0, 1], outputRange: [2, 22] }),
                },
              ],
            },
          ]}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

// 彩虹渐变按钮
export function GradientButton({
  children,
  onPress,
  disabled,
  style,
  colors: gradientColors,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  colors?: [string, string, ...string[]];
}) {
  const { colors: themeColors } = useTheme();
  const gc = gradientColors || themeColors.gradient;

  return (
    <ScalePress scale={0.97} onPress={onPress} disabled={disabled} style={style}>
      <LinearGradient
        colors={gc}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradientBtn, disabled && styles.gradientBtnDisabled]}
      >
        {children}
      </LinearGradient>
    </ScalePress>
  );
}

// 骨架屏脉冲
export function SkeletonPulse({ style }: { style?: ViewStyle }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.6, duration: 1000, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return <Animated.View style={[{ opacity }, style]} />;
}

const styles = StyleSheet.create({
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
  },
  track: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 2,
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  gradientBtn: {
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  gradientBtnDisabled: {
    opacity: 0.5,
  },
});
