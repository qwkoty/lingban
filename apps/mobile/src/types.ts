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

// 最新模型预设（2026年6月更新）
// DeepSeek V4 系列（2026-04-24 发布）：
//   deepseek-v4-pro（旗舰 1.6T）、deepseek-v4-flash（轻量 284B）
//   旧版 deepseek-chat / deepseek-reasoner 将于 2026-07-24 停用，不要再用
// Qwen 系列（2026-06）：
//   qwen3.7-plus（最新多模态 Agent）、qwen3.7-max（旗舰）
//   qwen-plus / qwen-turbo 为别名，自动指向最新版
export const PROVIDER_PRESETS: Record<Provider, { label: string; defaultModel: string; defaultApiUrl: string }> = {
  deepseek: { label: 'DeepSeek', defaultModel: 'deepseek-v4-flash', defaultApiUrl: 'https://api.deepseek.com/v1/chat/completions' },
  nvidia: { label: 'NVIDIA', defaultModel: 'meta/llama3-70b-instruct', defaultApiUrl: 'https://integrate.api.nvidia.com/v1/chat/completions' },
  qwen: { label: '通义千问', defaultModel: 'qwen3.7-plus', defaultApiUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions' },
  custom: { label: '自定义', defaultModel: '', defaultApiUrl: '' },
};
