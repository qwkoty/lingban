export type Theme = 'aurora' | 'colorful';

export interface User {
  id: number;
  nickname: string;
  avatar: string | null;
  persona: string;
  theme: Theme;
  memorySnapshot: string;
  createdAt: string;
}

export interface Agent {
  id: number;
  userId: number;
  name: string;
  avatar: string | null;
  persona: string;
  greeting: string;
  modelProvider: 'openai' | 'anthropic' | 'deepseek' | 'custom';
  modelName: string;
  apiEndpoint: string;
  temperature: number;
  maxTokens: number;
  apiKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: number;
  agentId: number;
  userId: number;
  role: 'system' | 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface ChatSession {
  agentId: number;
  agent: Agent;
  lastMessageAt: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
