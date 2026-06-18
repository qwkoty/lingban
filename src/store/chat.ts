import { create } from 'zustand'
import type { ChatMessage } from '../types'
import { chatApi } from '../lib/api'

interface ChatState {
  messages: ChatMessage[]
  loading: boolean
  streaming: boolean
  agentInfo: { id: number; name: string; avatar: string | null; persona: string } | null
  fetchMessages: (agentId: number) => Promise<void>
  sendMessage: (agentId: number, message: string) => Promise<void>
  clearMessages: () => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  loading: false,
  streaming: false,
  agentInfo: null,

  fetchMessages: async (agentId: number) => {
    set({ loading: true, messages: [] })
    try {
      const { agent, messages } = await chatApi.messages(agentId)
      set({ agentInfo: agent, messages, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  sendMessage: async (agentId: number, message: string) => {
    set({ streaming: true })

    // 添加用户消息
    const userMsg: ChatMessage = {
      id: Date.now(),
      agentId,
      userId: 0,
      role: 'user',
      content: message,
      createdAt: new Date().toISOString(),
    }
    set({ messages: [...get().messages, userMsg] })

    // 添加空的助手消息用于流式填充
    const assistantMsg: ChatMessage = {
      id: Date.now() + 1,
      agentId,
      userId: 0,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
    }
    set({ messages: [...get().messages, assistantMsg] })

    await new Promise<void>((resolve) => {
      chatApi.sendMessage(
        agentId,
        message,
        (chunk) => {
          const msgs = get().messages
          const last = msgs[msgs.length - 1]
          if (last && last.role === 'assistant') {
            const updated = [...msgs]
            updated[updated.length - 1] = { ...last, content: last.content + chunk }
            set({ messages: updated })
          }
        },
        (error) => {
          const msgs = get().messages
          const last = msgs[msgs.length - 1]
          if (last && last.role === 'assistant') {
            const updated = [...msgs]
            updated[updated.length - 1] = { ...last, content: `错误: ${error}` }
            set({ messages: updated })
          }
          set({ streaming: false })
          resolve()
        },
        () => {
          set({ streaming: false })
          resolve()
        },
      )
    })
  },

  clearMessages: () => set({ messages: [], agentInfo: null }),
}))
