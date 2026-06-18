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
  { id: 'openai', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
  { id: 'deepseek', name: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', models: ['deepseek-chat', 'deepseek-reasoner'] },
  { id: 'moonshot', name: 'Moonshot', baseUrl: 'https://api.moonshot.cn/v1', models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'] },
  { id: 'zhipu', name: '智谱', baseUrl: 'https://open.bigmodel.cn/api/paas/v4', models: ['glm-4-flash', 'glm-4', 'glm-4-air'] },
  { id: 'custom', name: '自定义', baseUrl: '', models: [] },
] as const
