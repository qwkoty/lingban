import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { AvatarCircle } from '../components/AvatarCircle';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Agent, PROVIDER_PRESETS } from '../types';
import { RootStackParamList } from '../navigation/AppNavigator';
import { AddIcon, EditIcon, TrashIcon } from '../components/icons';
import { ScalePress, StaggerItem, PulsingFAB } from '../components/animations';

type AgentsNav = NativeStackNavigationProp<RootStackParamList>;

export function AgentsListScreen() {
  const { colors } = useTheme();
  const { api, ensureUser } = useAuth();
  const navigation = useNavigation<AgentsNav>();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAgents = async () => {
    setLoading(true);
    try {
      await ensureUser();
      const res = await api.get('/api/agents');
      setAgents(res.data.agents || []);
    } catch (err) {
      Alert.alert('加载失败', err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadAgents();
    }, [])
  );

  const handleDelete = (agent: Agent) => {
    Alert.alert('删除智能体', `确定要删除「${agent.name}」吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/api/agents/${agent.id}`);
            loadAgents();
          } catch (err) {
            Alert.alert('删除失败', err instanceof Error ? err.message : '未知错误');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item, index }: { item: Agent; index: number }) => (
    <StaggerItem index={index}>
      <ScalePress
        scale={0.98}
        onPress={() => navigation.navigate('Chat', { agent: item })}
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            shadowColor: colors.shadow,
          },
        ]}
      >
        <AvatarCircle name={item.name} color={item.avatarUrl || undefined} size={52} />
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
            {PROVIDER_PRESETS[item.provider].label} / {item.model}
          </Text>
        </View>
        <ScalePress
          scale={0.85}
          onPress={() => navigation.navigate('AgentEdit', { agent: item })}
          style={[styles.iconButton, { backgroundColor: colors.surfaceAlt }]}
        >
          <EditIcon size={18} color={colors.primary} />
        </ScalePress>
        <ScalePress
          scale={0.85}
          onPress={() => handleDelete(item)}
          style={[styles.iconButton, { backgroundColor: colors.surfaceAlt, marginLeft: 8 }]}
        >
          <TrashIcon size={18} color={colors.danger} />
        </ScalePress>
      </ScalePress>
    </StaggerItem>
  );

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>我的智能体</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          选择一个开始对话
        </Text>
      </View>
      <FlatList
        data={agents}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[styles.list, { paddingBottom: 100 }]}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadAgents}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyGraphicWrap}>
              <LinearGradient
                colors={colors.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.emptyGraphicGlow}
              />
              <View
                style={[
                  styles.emptyGraphic,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <AvatarCircle name="?" color={colors.primary} size={72} />
              </View>
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>还没有智能体</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              点击右下角按钮创建你的第一个智能体
            </Text>
          </View>
        }
      />
      <PulsingFAB style={styles.fabWrap}>
        <ScalePress
          scale={0.92}
          onPress={() => navigation.navigate('AgentEdit', {})}
          accessibilityLabel="创建智能体"
          accessibilityRole="button"
        >
          <LinearGradient
            colors={colors.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.fab, { shadowColor: colors.shadow }]}
          >
            <AddIcon size={28} color={colors.textInverse} />
          </LinearGradient>
        </ScalePress>
      </PulsingFAB>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 14,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 6,
    fontWeight: '500',
  },
  list: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 3,
  },
  info: {
    flex: 1,
    marginLeft: 14,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
  },
  meta: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabWrap: {
    position: 'absolute',
    right: 22,
    bottom: 30,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  empty: {
    alignItems: 'center',
    marginTop: 90,
    paddingHorizontal: 24,
  },
  emptyGraphicWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyGraphicGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    opacity: 0.35,
    transform: [{ scale: 1.1 }],
  },
  emptyGraphic: {
    width: 112,
    height: 112,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    fontWeight: '500',
    textAlign: 'center',
  },
});
