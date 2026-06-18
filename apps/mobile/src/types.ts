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
// DeepSeek V4 系列：deepseek-v4-pro（旗舰）、deepseek-v4-flash（轻量）
//   deepseek-chat 仍可用（指向 V4-Flash 非思考模式）
//   deepseek-reasoner 仍可用（指向 V4-Flash 思考模式）
// Qwen 系列：qwen3-max（旗舰）、qwen-plus（均衡）、qwen-turbo（快速）
export const PROVIDER_PRESETS: Record<Provider, { label: string; defaultModel: string; defaultApiUrl: string }> = {
  deepseek: { label: 'DeepSeek', defaultModel: 'deepseek-chat', defaultApiUrl: 'https://api.deepseek.com/v1/chat/completions' },
  nvidia: { label: 'NVIDIA', defaultModel: 'meta/llama3-70b-instruct', defaultApiUrl: 'https://integrate.api.nvidia.com/v1/chat/completions' },
  qwen: { label: '通义千问', defaultModel: 'qwen-plus', defaultApiUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions' },
  custom: { label: '自定义', defaultModel: '', defaultApiUrl: '' },
};
