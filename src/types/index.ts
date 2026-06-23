export interface User {
  id: string;
  token: string;
  nickname: string;
  avatar: string | null;
  persona: string;
  theme: string;
  createdAt: string;
  updatedAt: string;
}

export interface Agent {
  id: string;
  userId: string;
  name: string;
  avatar: string | null;
  persona: string;
  greeting: string;
  modelProvider: string;
  modelName: string;
  apiEndpoint: string;
  temperature: number;
  maxTokens: number;
  apiKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  agentId: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

export type ModelProvider = 'openai' | 'deepseek' | 'anthropic' | 'custom';

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  persona: string;
  greeting: string;
  modelProvider: ModelProvider;
  modelName: string;
  temperature: number;
  maxTokens: number;
  avatarEmoji: string;
}

export type ThemeType = 'aurora' | 'dark';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
