import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useTheme } from '../theme/ThemeContext';
import { ACCENTS, AccentKey } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/AppNavigator';
import { ThemeIcon, ShieldIcon, ServerIcon, ChevronRightIcon } from '../components/icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_KEY } from '../context/AuthContext';
import { ScalePress, FadeIn } from '../components/animations';

type ProfileNav = NativeStackNavigationProp<RootStackParamList>;

// 七彩主题色顺序：极光、蓝、青、绿、橙、粉、紫
const ACCENT_ORDER: AccentKey[] = ['aurora', 'blue', 'cyan', 'green', 'amber', 'pink', 'violet'];

export function ProfileScreen() {
  const { accent, colors, setAccent } = useTheme();
  const { user, apiBase, setApiBase, logout } = useAuth();
  const navigation = useNavigation<ProfileNav>();
  const [editingServer, setEditingServer] = useState(false);
  const [serverUrl, setServerUrl] = useState(apiBase);

  useEffect(() => {
    setServerUrl(apiBase);
  }, [apiBase]);

  const saveServerUrl = async () => {
    const url = serverUrl.trim();
    if (!url) {
      Alert.alert('地址不能为空');
      return;
    }
    await setApiBase(url);
    await AsyncStorage.setItem(API_BASE_KEY, url);
    setEditingServer(false);
    Alert.alert('已保存', '重启应用后生效');
  };

  const handleLogout = () => {
    Alert.alert('清除本地数据', '确定要清除当前设备上的登录信息吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.replace('Splash');
        },
      },
    ]);
  };

  const renderRow = ({
    icon,
    label,
    value,
    onPress,
    right,
  }: {
    icon: React.ReactNode;
    label: string;
    value?: string;
    onPress?: () => void;
    right?: React.ReactNode;
  }) => (
    <ScalePress scale={0.98} disabled={!onPress} onPress={onPress}>
      <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.rowLeft}>{icon}</View>
        <View style={styles.rowCenter}>
          <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
          {value ? <Text style={[styles.rowValue, { color: colors.textSecondary }]}>{value}</Text> : null}
        </View>
        {right || (onPress && <ChevronRightIcon size={18} color={colors.textSecondary} />)}
      </View>
    </ScalePress>
  );

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* 顶部用户信息卡片 */}
        <FadeIn>
          <View
            style={[
              styles.headerCard,
              { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow },
            ]}
          >
            <LinearGradient
              colors={colors.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>{user?.id || '?'}</Text>
            </LinearGradient>
            <View style={styles.headerInfo}>
              <Text style={[styles.userTitle, { color: colors.text }]}>用户 {user?.id || ''}</Text>
              <Text style={[styles.userSubtitle, { color: colors.textSecondary }]}>匿名用户，无需登录</Text>
            </View>
          </View>
        </FadeIn>

        {/* 外观 — 彩虹渐变主题色选择器 */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>外观</Text>
        <FadeIn delay={80}>
          <View
            style={[
              styles.themeCard,
              { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow },
            ]}
          >
            <View style={styles.themeHeader}>
              <ThemeIcon size={20} color={colors.primary} />
              <Text style={[styles.themeTitle, { color: colors.text }]}>主题色彩</Text>
              <Text style={[styles.themeValue, { color: colors.textSecondary }]}>{ACCENTS[accent].label}</Text>
            </View>
            <View style={styles.colorDots}>
              {ACCENT_ORDER.map((key) => {
                const preset = ACCENTS[key];
                const selected = key === accent;
                return (
                  <ScalePress key={key} scale={0.85} onPress={() => setAccent(key)}>
                    <LinearGradient
                      colors={preset.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[styles.colorDot, selected && styles.colorDotSelected]}
                    />
                  </ScalePress>
                );
              })}
            </View>
          </View>
        </FadeIn>

        {/* 服务 */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>服务</Text>
        {editingServer ? (
          <FadeIn>
            <View
              style={[
                styles.editServer,
                { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow },
              ]}
            >
              <TextInput
                value={serverUrl}
                onChangeText={setServerUrl}
                placeholder="https://..."
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                style={[
                  styles.serverInput,
                  { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBackground },
                ]}
              />
              <View style={styles.editButtons}>
                <ScalePress
                  scale={0.95}
                  onPress={() => setEditingServer(false)}
                  style={[styles.editBtn, { backgroundColor: colors.surfaceAlt }]}
                >
                  <Text style={[styles.editBtnText, { color: colors.text }]}>取消</Text>
                </ScalePress>
                <ScalePress
                  scale={0.95}
                  onPress={saveServerUrl}
                  style={[styles.editBtn, { backgroundColor: colors.primary }]}
                >
                  <Text style={[styles.editBtnText, { color: colors.textInverse }]}>保存</Text>
                </ScalePress>
              </View>
            </View>
          </FadeIn>
        ) : (
          renderRow({
            icon: <ServerIcon size={22} color={colors.primary} />,
            label: '服务器地址',
            value: apiBase,
            onPress: () => setEditingServer(true),
          })
        )}

        {/* 关于 */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>关于</Text>
        {renderRow({
          icon: <ShieldIcon size={22} color={colors.primary} />,
          label: '隐私政策',
          onPress: () => navigation.navigate('Privacy'),
        })}

        {/* 清除本地数据按钮 */}
        <ScalePress scale={0.97} onPress={handleLogout}>
          <View style={[styles.logoutButton, { backgroundColor: colors.danger }]}>
            <Text style={[styles.logoutText, { color: colors.textInverse }]}>清除本地数据</Text>
          </View>
        </ScalePress>

        <Text style={[styles.version, { color: colors.textSecondary }]}>灵伴 v1.0.0</Text>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 8,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  headerInfo: {
    flex: 1,
  },
  userTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  userSubtitle: {
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 22,
    marginBottom: 10,
    marginLeft: 6,
  },
  themeCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 6,
  },
  themeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  themeTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 10,
    flex: 1,
  },
  themeValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  colorDots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  colorDotSelected: {
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  rowLeft: {
    width: 36,
  },
  rowCenter: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  rowValue: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  editServer: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 6,
  },
  serverInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  editBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 12,
    marginLeft: 10,
  },
  editBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  logoutButton: {
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '800',
  },
  version: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 12,
    fontWeight: '500',
  },
});
