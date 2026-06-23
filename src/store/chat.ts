import { create } from 'zustand';
import type { Agent, ChatMessage } from '../types';
import { api, streamChat } from '../lib/api';

interface ChatState {
  agent: Agent | null;
  messages: ChatMessage[];
  loading: boolean;
  streaming: boolean;
  streamingContent: string;
  error: string | null;
  abortController: AbortController | null;

  fetchHistory: (agentId: number) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  regenerate: () => Promise<void>;
  clearHistory: () => Promise<void>;
  stopStreaming: () => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  agent: null,
  messages: [],
  loading: false,
  streaming: false,
  streamingContent: '',
  error: null,
  abortController: null,

  fetchHistory: async (agentId) => {
    set({ loading: true, error: null, messages: [], agent: null });
    try {
      const { agent, messages } = await api.getHistory(agentId);
      set({ agent, messages, loading: false });
    } catch (err) {
      set({ loading: false, error: (err as Error).message });
    }
  },

  sendMessage: async (content) => {
    const { agent } = get();
    if (!agent || !content.trim() || get().streaming) return;

    // 乐观更新：先显示用户消息
    const userMessage: ChatMessage = {
      id: Date.now(),
      agentId: agent.id,
      userId: 0,
      role: 'user',
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };
    set({
      messages: [...get().messages, userMessage],
      streaming: true,
      streamingContent: '',
      error: null,
    });

    const controller = new AbortController();
    set({ abortController: controller });

    await streamChat(
      agent.id,
      content.trim(),
      {
        onChunk: (chunk) => {
          set({ streamingContent: get().streamingContent + chunk });
        },
        onError: (error) => {
          set({ streaming: false, error, abortController: null });
        },
        onDone: (fullContent, messageId) => {
          if (fullContent.trim()) {
            const assistantMessage: ChatMessage = {
              id: messageId || Date.now(),
              agentId: agent.id,
              userId: 0,
              role: 'assistant',
              content: fullContent,
              createdAt: new Date().toISOString(),
            };
            set({
              messages: [...get().messages, assistantMessage],
              streamingContent: '',
              streaming: false,
              abortController: null,
            });
          } else {
            set({ streaming: false, streamingContent: '', abortController: null });
          }
        },
      },
      controller.signal,
    );
  },

  regenerate: async () => {
    const { messages, agent } = get();
    if (!agent || get().streaming) return;

    // 找到最后一条用户消息
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUserMsg) return;

    // 移除最后一条 assistant 消息
    const newMessages = [...messages];
    const lastAssistantIdx = newMessages.map((m) => m.role).lastIndexOf('assistant');
    if (lastAssistantIdx >= 0) {
      newMessages.splice(lastAssistantIdx, 1);
    }
    set({ messages: newMessages });

    // 重新发送
    await get().sendMessage(lastUserMsg.content);
  },

  clearHistory: async () => {
    const { agent } = get();
    if (!agent) return;
    try {
      await api.clearHistory(agent.id);
      set({ messages: [] });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  stopStreaming: () => {
    const { abortController } = get();
    abortController?.abort();
    set({ streaming: false, streamingContent: '', abortController: null });
  },

  reset: () => {
    get().abortController?.abort();
    set({
      agent: null,
      messages: [],
      loading: false,
      streaming: false,
      streamingContent: '',
      error: null,
      abortController: null,
    });
  },
}));
