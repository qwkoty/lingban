import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/AppNavigator';
import { BotIcon } from '../components/icons';

type SplashNav = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

export function SplashScreen() {
  const { colors } = useTheme();
  const { ensureUser, apiBase } = useAuth();
  const navigation = useNavigation<SplashNav>();
  const [status, setStatus] = useState('正在连接灵伴...');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await ensureUser();
        if (mounted) {
          setStatus('准备就绪');
          navigation.replace('Main');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setStatus(`连接失败: ${message}`);
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
      <View style={[styles.logoContainer, { backgroundColor: colors.surfaceAlt }]}>
        <BotIcon size={64} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>灵伴</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>你的专属智能体助手</Text>
      <ActivityIndicator style={{ marginTop: 32 }} color={colors.primary} />
      <Text style={[styles.status, { color: colors.textSecondary }]}>{status}</Text>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 15,
    marginTop: 8,
  },
  status: {
    fontSize: 13,
    marginTop: 16,
  },
});
