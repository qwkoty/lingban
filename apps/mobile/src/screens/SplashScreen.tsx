import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/AppNavigator';
import { BotIcon } from '../components/icons';
import { FadeIn } from '../components/animations';

type SplashNav = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

export function SplashScreen() {
  const { colors } = useTheme();
  const { ensureUser, apiBase } = useAuth();
  const navigation = useNavigation<SplashNav>();
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, friction: 6, useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();

    let mounted = true;
    (async () => {
      try {
        await ensureUser();
        if (mounted) navigation.replace('Main');
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        Alert.alert('连接失败', `无法连接到服务器 (${apiBase})，请在「我的」页面检查服务器地址。`);
        setTimeout(() => {
          if (mounted) navigation.replace('Main');
        }, 1500);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <ScreenWrapper style={{ justifyContent: 'center', alignItems: 'center' }}>
      {/* 彩虹渐变光晕 */}
      <View style={styles.haloLayer} pointerEvents="none">
        <LinearGradient
          colors={[colors.gradient[0], colors.gradient[1], colors.gradient[2], 'transparent']}
          locations={[0, 0.35, 0.7, 1]}
          style={styles.rainbowHalo}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </View>
      <Animated.View
        style={[
          styles.logoWrapper,
          { opacity: logoOpacity, transform: [{ scale: logoScale }] },
        ]}
      >
        <LinearGradient
          colors={colors.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logoContainer}
        >
          <BotIcon size={64} color="#FFFFFF" />
        </LinearGradient>
      </Animated.View>
      <FadeIn delay={300} duration={500} translateY={12}>
        <Text style={[styles.title, { color: colors.text }]}>灵伴</Text>
      </FadeIn>
      <FadeIn delay={450} duration={500} translateY={12}>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>你的专属智能体助手</Text>
      </FadeIn>
      <FadeIn delay={600} duration={500} translateY={8}>
        <View style={[styles.loader, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.loaderDot, { backgroundColor: colors.primary }]} />
          <View style={[styles.loaderDot, { backgroundColor: colors.primaryLight }]} />
          <View style={[styles.loaderDot, { backgroundColor: colors.textTertiary }]} />
        </View>
      </FadeIn>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  haloLayer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rainbowHalo: {
    width: 380,
    height: 380,
    borderRadius: 190,
    opacity: 0.15,
  },
  logoWrapper: {
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 28,
    elevation: 10,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: 6,
  },
  subtitle: {
    fontSize: 15,
    marginTop: 10,
    fontWeight: '500',
  },
  loader: {
    flexDirection: 'row',
    marginTop: 40,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  loaderDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginHorizontal: 4,
  },
});
