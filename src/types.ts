export type Theme = 'aurora' | 'colorful';

export interface User {
  id: number;
  nickname: string;
  avatar: string | null;
  persona: string;
  theme: Theme;
  createdAt: string;
}

export interface Agent {
  id: number;
  userId: number;
  name: string;
  avatar: string | null;
  persona: string;
  modelProvider: string;
  modelName: string;
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
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

export interface ChatSession {
  agentId: number;
  agent: Agent;
  lastMessageAt: string;
}
