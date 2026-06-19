import { create } from 'zustand';
import type { ChatMessage, ChatSession } from '../types.js';
import { chatApi } from '../lib/api.js';

interface ChatState {
  sessions: ChatSession[];
  messages: ChatMessage[];
  loading: boolean;
  streaming: boolean;
  fetchSessions: () => Promise<void>;
  fetchHistory: (agentId: number) => Promise<void>;
  sendMessage: (
    agentId: number,
    message: string,
    onUpdate: () => void
  ) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  messages: [],
  loading: false,
  streaming: false,

  fetchSessions: async () => {
    const { sessions } = await chatApi.sessions();
    set({ sessions });
  },

  fetchHistory: async (agentId) => {
    set({ loading: true });
    try {
      const { messages } = await chatApi.history(agentId);
      set({ messages });
    } finally {
      set({ loading: false });
    }
  },

  sendMessage: async (agentId, message, onUpdate) => {
    const userMessage: ChatMessage = {
      id: Date.now(),
      agentId,
      userId: 0,
      role: 'user',
      content: message,
      createdAt: new Date().toISOString(),
    };

    set({ messages: [...get().messages, userMessage], streaming: true });
    onUpdate();

    const assistantMessage: ChatMessage = {
      id: Date.now() + 1,
      agentId,
      userId: 0,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
    };

    set({ messages: [...get().messages, assistantMessage] });

    await chatApi.send(
      agentId,
      message,
      (chunk) => {
        if (chunk.error) {
          assistantMessage.content = chunk.error;
        } else if (chunk.content) {
          assistantMessage.content += chunk.content;
        }
        set({ messages: [...get().messages] });
        onUpdate();
      },
      () => {
        set({ streaming: false });
        get().fetchSessions();
      }
    );
  },
}));
