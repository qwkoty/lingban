import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/AppNavigator';
import { ThemeIcon, ShieldIcon, ServerIcon, ChevronRightIcon } from '../components/icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_KEY } from '../context/AuthContext';

type ProfileNav = NativeStackNavigationProp<RootStackParamList>;

export function ProfileScreen() {
  const { colors, mode, toggle } = useTheme();
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
  }: {
    icon: React.ReactNode;
    label: string;
    value?: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={!onPress}
      onPress={onPress}
      style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={styles.rowLeft}>{icon}</View>
      <View style={styles.rowCenter}>
        <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
        {value ? <Text style={[styles.rowValue, { color: colors.textSecondary }]}>{value}</Text> : null}
      </View>
      {onPress && <ChevronRightIcon size={18} color={colors.textSecondary} />}
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={[styles.headerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{user?.id || '?'}</Text>
          </View>
          <View>
            <Text style={[styles.userTitle, { color: colors.text }]}>用户 {user?.id || ''}</Text>
            <Text style={[styles.userSubtitle, { color: colors.textSecondary }]}>匿名用户，无需登录</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>外观</Text>
        {renderRow({
          icon: <ThemeIcon size={22} color={colors.primary} />,
          label: '主题风格',
          value: mode === 'warm' ? '暖色调' : '冷色调',
          onPress: toggle,
        })}

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>服务</Text>
        {editingServer ? (
          <View style={[styles.editServer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              value={serverUrl}
              onChangeText={setServerUrl}
              placeholder="https://..."
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              style={[styles.serverInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBackground }]}
            />
            <View style={styles.editButtons}>
              <TouchableOpacity onPress={() => setEditingServer(false)} style={[styles.editBtn, { backgroundColor: colors.surfaceAlt }]}>
                <Text style={{ color: colors.text }}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveServerUrl} style={[styles.editBtn, { backgroundColor: colors.primary }]}>
                <Text style={{ color: colors.textInverse }}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          renderRow({
            icon: <ServerIcon size={22} color={colors.primary} />,
            label: '服务器地址',
            value: apiBase,
            onPress: () => setEditingServer(true),
          })
        )}

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>关于</Text>
        {renderRow({
          icon: <ShieldIcon size={22} color={colors.primary} />,
          label: '隐私政策',
          onPress: () => navigation.navigate('Privacy'),
        })}

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleLogout}
          style={[styles.logoutButton, { backgroundColor: colors.danger }]}
        >
          <Text style={[styles.logoutText, { color: colors.textInverse }]}>清除本地数据</Text>
        </TouchableOpacity>

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
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  userTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  userSubtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
    marginLeft: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
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
    fontWeight: '600',
  },
  rowValue: {
    fontSize: 12,
    marginTop: 2,
  },
  editServer: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  serverInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
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
    borderRadius: 8,
    marginLeft: 10,
  },
  logoutButton: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
  },
  version: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 12,
  },
});
