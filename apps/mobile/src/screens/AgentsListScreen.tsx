import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { AvatarCircle } from '../components/AvatarCircle';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Agent, PROVIDER_PRESETS } from '../types';
import { RootStackParamList } from '../navigation/AppNavigator';
import { AddIcon, EditIcon, TrashIcon } from '../components/icons';

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

  const renderItem = ({ item }: { item: Agent }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => navigation.navigate('Chat', { agent: item })}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}
    >
      <AvatarCircle name={item.name} color={item.avatarUrl || undefined} size={52} />
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          {PROVIDER_PRESETS[item.provider].label} / {item.model}
        </Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => navigation.navigate('AgentEdit', { agent: item })}
          style={[styles.iconButton, { backgroundColor: colors.surfaceAlt }]}
        >
          <EditIcon size={18} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDelete(item)}
          style={[styles.iconButton, { backgroundColor: colors.surfaceAlt, marginLeft: 8 }]}
        >
          <TrashIcon size={18} color={colors.danger} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>我的智能体</Text>
      </View>
      <FlatList
        data={agents}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadAgents} colors={[colors.primary]} />}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>还没有智能体</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>点击右下角按钮创建一个吧</Text>
          </View>
        }
      />
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => navigation.navigate('AgentEdit', {})}
        accessibilityLabel="创建智能体"
        accessibilityRole="button"
        style={[styles.fab, { backgroundColor: colors.primary, shadowColor: colors.shadow }]}
      >
        <AddIcon size={28} color={colors.textInverse} />
      </TouchableOpacity>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  list: {
    padding: 16,
    paddingBottom: 96,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  info: {
    flex: 1,
    marginLeft: 14,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  meta: {
    fontSize: 12,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  empty: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
  },
});
