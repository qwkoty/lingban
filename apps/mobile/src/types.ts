export type Provider = 'deepseek' | 'nvidia' | 'qwen' | 'custom';

export interface Agent {
  id: number;
  name: string;
  provider: Provider;
  model: string;
  apiKey: string;
  apiUrl?: string | null;
  systemPrompt?: string | null;
  temperature: number;
  maxTokens: number;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMessage {
  id: number;
  agentId: number;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export const PROVIDER_PRESETS: Record<Provider, { label: string; defaultModel: string; defaultApiUrl: string }> = {
  deepseek: { label: 'DeepSeek', defaultModel: 'deepseek-chat', defaultApiUrl: 'https://api.deepseek.com/v1/chat/completions' },
  nvidia: { label: 'NVIDIA', defaultModel: 'meta/llama3-70b-instruct', defaultApiUrl: 'https://integrate.api.nvidia.com/v1/chat/completions' },
  qwen: { label: '通义千问', defaultModel: 'qwen-turbo', defaultApiUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions' },
  custom: { label: '自定义', defaultModel: '', defaultApiUrl: '' },
};
