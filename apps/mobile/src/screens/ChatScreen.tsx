import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { AvatarCircle } from '../components/AvatarCircle';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { ConversationMessage } from '../types';
import { RootStackParamList } from '../navigation/AppNavigator';
import { SendIcon } from '../components/icons';

type ChatRoute = RouteProp<RootStackParamList, 'Chat'>;

export function ChatScreen() {
  const { colors } = useTheme();
  const { api } = useAuth();
  const route = useRoute<ChatRoute>();
  const { agent } = route.params;
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const loadHistory = async () => {
    try {
      const res = await api.get(`/api/agents/${agent.id}/conversations?sessionId=default`);
      setMessages(res.data.conversations || []);
    } catch (err) {
      Alert.alert('加载历史失败', err instanceof Error ? err.message : '未知错误');
    }
  };

  useEffect(() => {
    loadHistory();
  }, [agent.id]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setLoading(true);

    const userMsg: ConversationMessage = {
      id: Date.now(),
      agentId: agent.id,
      sessionId: 'default',
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await api.post(`/api/agents/${agent.id}/chat`, { message: text, sessionId: 'default' });
      const assistantMsg: ConversationMessage = {
        id: Date.now() + 1,
        agentId: agent.id,
        sessionId: 'default',
        role: 'assistant',
        content: res.data.reply || '',
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      Alert.alert('发送失败', err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: ConversationMessage }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.bubbleRow, isUser ? styles.userRow : styles.agentRow]}>
        {!isUser && <AvatarCircle name={agent.name} color={agent.avatarUrl || undefined} size={36} />}
        <View
          style={[
            styles.bubble,
            isUser
              ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 }
              : { backgroundColor: colors.surface, borderBottomLeftRadius: 4, borderColor: colors.border, borderWidth: 1 },
          ]}
        >
          <Text style={{ color: isUser ? colors.textInverse : colors.text, fontSize: 15, lineHeight: 22 }}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.header}>
          <AvatarCircle name={agent.name} color={agent.avatarUrl || undefined} size={40} />
          <View style={{ marginLeft: 12 }}>
            <Text style={[styles.agentName, { color: colors.text }]}>{agent.name}</Text>
            <Text style={[styles.agentMeta, { color: colors.textSecondary }]}>点击卡片进入设置</Text>
          </View>
        </View>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
        <View style={[styles.inputBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="输入消息..."
            placeholderTextColor={colors.textSecondary}
            multiline
            style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
          />
          <TouchableOpacity
            activeOpacity={0.8}
            disabled={loading || !input.trim()}
            onPress={sendMessage}
            style={[
              styles.sendButton,
              { backgroundColor: loading || !input.trim() ? colors.border : colors.primary },
            ]}
          >
            <SendIcon size={20} color={colors.textInverse} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  agentName: {
    fontSize: 16,
    fontWeight: '700',
  },
  agentMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  list: {
    padding: 16,
    paddingBottom: 24,
  },
  bubbleRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  agentRow: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '76%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
});
