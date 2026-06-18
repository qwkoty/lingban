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
  Animated,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { AvatarCircle } from '../components/AvatarCircle';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { ConversationMessage } from '../types';
import { RootStackParamList } from '../navigation/AppNavigator';
import { SendIcon } from '../components/icons';
import { TypingIndicator } from '../components/animations';

type ChatRoute = RouteProp<RootStackParamList, 'Chat'>;

function MessageBubble({
  item,
  agent,
  colors,
}: {
  item: ConversationMessage;
  agent: any;
  colors: any;
}) {
  const isUser = item.role === 'user';
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(isUser ? 20 : -20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(translateX, { toValue: 0, friction: 7, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.bubbleRow,
        isUser ? styles.userRow : styles.agentRow,
        { opacity, transform: [{ translateX }] },
      ]}
    >
      {!isUser && <AvatarCircle name={agent.name} color={agent.avatarUrl || undefined} size={36} />}
      {isUser ? (
        <LinearGradient
          colors={colors.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.bubble, styles.userBubble]}
        >
          <Text style={styles.userText}>{item.content}</Text>
        </LinearGradient>
      ) : (
        <View
          style={[
            styles.bubble,
            styles.agentBubble,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.agentText, { color: colors.text }]}>{item.content}</Text>
        </View>
      )}
    </Animated.View>
  );
}

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

  const canSend = !loading && !!input.trim();

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <AvatarCircle name={agent.name} color={agent.avatarUrl || undefined} size={42} />
          <View style={styles.headerInfo}>
            <Text style={[styles.agentName, { color: colors.text }]}>{agent.name}</Text>
            <Text style={[styles.agentMeta, { color: colors.textSecondary }]}>{agent.model}</Text>
          </View>
        </View>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <MessageBubble item={item} agent={agent} colors={colors} />}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
        {loading && (
          <View style={[styles.typingRow, { paddingHorizontal: 16 }]}>
            <AvatarCircle name={agent.name} color={agent.avatarUrl || undefined} size={28} />
            <View
              style={[
                styles.typingBubble,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <TypingIndicator color={colors.primary} />
            </View>
          </View>
        )}
        <View
          style={[
            styles.inputBar,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
            },
          ]}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="输入消息..."
            placeholderTextColor={colors.textSecondary}
            multiline
            style={[
              styles.input,
              {
                backgroundColor: colors.inputBackground,
                color: colors.text,
              },
            ]}
          />
          {canSend ? (
            <LinearGradient
              colors={colors.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sendButton}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={false}
                onPress={sendMessage}
                style={styles.sendButtonTouch}
              >
                <SendIcon size={20} color={colors.textInverse} />
              </TouchableOpacity>
            </LinearGradient>
          ) : (
            <View
              style={[
                styles.sendButton,
                { backgroundColor: colors.surfaceAlt },
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                disabled
                onPress={sendMessage}
                style={styles.sendButtonTouch}
              >
                <SendIcon size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerInfo: {
    marginLeft: 14,
  },
  agentName: {
    fontSize: 17,
    fontWeight: '700',
  },
  agentMeta: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  list: {
    padding: 16,
    paddingBottom: 24,
  },
  bubbleRow: {
    flexDirection: 'row',
    marginBottom: 14,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userBubble: {
    borderBottomRightRadius: 6,
  },
  userText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
  },
  agentBubble: {
    borderBottomLeftRadius: 6,
    borderWidth: 1,
  },
  agentText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  typingBubble: {
    marginLeft: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 11,
    fontSize: 15,
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    overflow: 'hidden',
  },
  sendButtonTouch: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
