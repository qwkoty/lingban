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
      Animated.timing(translate, { toValue: 0, duration, delay, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY: translate }] }, style]}>
      {children}
    </Animated.View>
  );
}

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
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, friction: 5 }).start();
    onPressOut?.(e);
  };

  return (
    <TouchableOpacity activeOpacity={0.9} onPressIn={pressIn} onPressOut={pressOut} {...rest}>
      <Animated.View style={[{ transform: [{ scale: anim }] }, style]}>{children}</Animated.View>
    </TouchableOpacity>
  );
}

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

export function PulsingFAB({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return <Animated.View style={[{ transform: [{ scale }] }, style]}>{children}</Animated.View>;
}

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
});
