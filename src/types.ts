// 类型定义

export interface User {
  id: number
  nickname: string
  avatar: string | null
  createdAt: string
}

export interface Agent {
  id: number
  userId: number
  name: string
  avatar: string | null
  persona: string
  modelProvider: string
  apiBaseUrl: string
  modelName: string
  temperature: number
  maxTokens: number
  apiKey: string
  createdAt: string
  updatedAt: string
}

export interface ChatMessage {
  id: number
  agentId: number
  userId: number
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: string
}

export interface ChatSession {
  agentId: number
  agentName: string
  agentAvatar: string | null
  lastMessage: string
  lastMessageAt: string
}

export interface AgentFormData {
  name: string
  avatar: string | null
  persona: string
  modelProvider: string
  apiBaseUrl: string
  modelName: string
  temperature: number
  maxTokens: number
  apiKey: string
}

// 模型提供商预设
export const MODEL_PROVIDERS = [
  { id: 'deepseek', name: 'DeepSeek', baseUrl: 'https://api.deepseek.com', models: ['deepseek-v4-pro', 'deepseek-v4-flash'] },
  { id: 'custom', name: '自定义', baseUrl: '', models: [] },
] as const
