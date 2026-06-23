import { create } from 'zustand';
import type { Agent, ChatMessage } from '@/types';
import { chatApi, agentsApi } from '@/lib/api';

interface ChatState {
  agent: Agent | null;
  messages: ChatMessage[];
  streaming: boolean;
  streamingContent: string;
  loading: boolean;
  error: string | null;
  fetchHistory: (agentId: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  regenerate: () => Promise<void>;
  clearHistory: () => Promise<void>;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  agent: null,
  messages: [],
  streaming: false,
  streamingContent: '',
  loading: false,
  error: null,

  fetchHistory: async (agentId) => {
    set({ loading: true, error: null });
    try {
      const [agent, messages] = await Promise.all([
        agentsApi.get(agentId),
        chatApi.getMessages(agentId),
      ]);
      set({ agent, messages, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '获取对话历史失败',
        loading: false,
      });
      throw error;
    }
  },

  sendMessage: async (content) => {
    const { agent, messages } = get();
    if (!agent || get().streaming) return;

    // 立即添加用户消息到 UI
    const tempUserMessage: ChatMessage = {
      id: 'temp-' + Date.now(),
      agentId: agent.id,
      userId: agent.userId,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };

    set({
      messages: [...messages, tempUserMessage],
      streaming: true,
      streamingContent: '',
      error: null,
    });

    try {
      const fullContent = await chatApi.streamSend(agent.id, content, (chunk) => {
        set((state) => ({
          streamingContent: state.streamingContent + chunk,
        }));
      });

      // 流式完成后，添加正式的 assistant 消息
      const newAssistantMessage: ChatMessage = {
        id: 'assistant-' + Date.now(),
        agentId: agent.id,
        userId: agent.userId,
        role: 'assistant',
        content: fullContent,
        createdAt: new Date().toISOString(),
      };

      set((state) => ({
        messages: [...state.messages.filter((m) => m.id !== tempUserMessage.id), tempUserMessage, newAssistantMessage],
        streaming: false,
        streamingContent: '',
      }));

      // 重新获取历史以确保同步
      await get().fetchHistory(agent.id);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '发送消息失败',
        streaming: false,
        streamingContent: '',
        messages: messages, // 回滚
      });
      throw error;
    }
  },

  regenerate: async () => {
    const { agent, messages } = get();
    if (!agent || get().streaming || messages.length === 0) return;

    // 移除最后一条 assistant 消息
    const messagesWithoutLast = messages.filter((m) => m.role !== 'assistant' || m.id !== messages[messages.length - 1].id);
    // 如果最后一条是 user 消息也先移除（等下重新生成）
    const lastUserIndex = [...messagesWithoutLast].reverse().findIndex((m) => m.role === 'user');
    const baseMessages = lastUserIndex >= 0 
      ? messagesWithoutLast.slice(0, messagesWithoutLast.length - lastUserIndex - 1)
      : messagesWithoutLast;

    // 找到最后一条用户消息
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUserMsg) return;

    set({
      messages: [...baseMessages, lastUserMsg],
      streaming: true,
      streamingContent: '',
      error: null,
    });

    try {
      const fullContent = await chatApi.streamRegenerate(agent.id, (chunk) => {
        set((state) => ({
          streamingContent: state.streamingContent + chunk,
        }));
      });

      const newAssistantMessage: ChatMessage = {
        id: 'assistant-' + Date.now(),
        agentId: agent.id,
        userId: agent.userId,
        role: 'assistant',
        content: fullContent,
        createdAt: new Date().toISOString(),
      };

      set((state) => ({
        messages: [...state.messages, newAssistantMessage],
        streaming: false,
        streamingContent: '',
      }));

      await get().fetchHistory(agent.id);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '重新生成失败',
        streaming: false,
        streamingContent: '',
        messages,
      });
      throw error;
    }
  },

  clearHistory: async () => {
    const { agent } = get();
    if (!agent) return;

    set({ loading: true, error: null });
    try {
      await chatApi.clearHistory(agent.id);
      set({ messages: [], loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '清空对话失败',
        loading: false,
      });
      throw error;
    }
  },

  reset: () => {
    set({
      agent: null,
      messages: [],
      streaming: false,
      streamingContent: '',
      loading: false,
      error: null,
    });
  },
}));
