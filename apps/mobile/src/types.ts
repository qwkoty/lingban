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

export interface ModelOption {
  id: string;
  label: string;
  desc: string;
}

export interface ProviderPreset {
  label: string;
  defaultModel: string;
  defaultApiUrl: string;
  models: ModelOption[];
}

// 最新模型预设（2026年6月更新）
// DeepSeek V4 系列（2026-04-24 发布）：
//   deepseek-v4-flash（284B MoE，高速，$0.14/1M 输入，默认推荐）
//   deepseek-v4-pro（1.6T MoE，旗舰推理，$0.435/1M 输入）
//   旧版 deepseek-chat / deepseek-reasoner 将于 2026-07-24 停用，不要再用
// Qwen 3.7 系列：
//   qwen3.7-plus（多模态 Agent，2026-06-01 发布，$0.40/1M 输入）
//   qwen3.7-max（文本旗舰，1M context，2026-05-20 发布）
export const PROVIDER_PRESETS: Record<Provider, ProviderPreset> = {
  deepseek: {
    label: 'DeepSeek',
    defaultModel: 'deepseek-v4-flash',
    defaultApiUrl: 'https://api.deepseek.com/v1/chat/completions',
    models: [
      { id: 'deepseek-v4-flash', label: 'V4-Flash', desc: '高速 · 284B · 默认推荐' },
      { id: 'deepseek-v4-pro', label: 'V4-Pro', desc: '旗舰 · 1.6T · 深度推理' },
    ],
  },
  nvidia: {
    label: 'NVIDIA',
    defaultModel: 'meta/llama3-70b-instruct',
    defaultApiUrl: 'https://integrate.api.nvidia.com/v1/chat/completions',
    models: [
      { id: 'meta/llama3-70b-instruct', label: 'Llama3 70B', desc: 'Meta · 70B' },
      { id: 'meta/llama3-405b-instruct', label: 'Llama3 405B', desc: 'Meta · 405B' },
    ],
  },
  qwen: {
    label: '通义千问',
    defaultModel: 'qwen3.7-plus',
    defaultApiUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    models: [
      { id: 'qwen3.7-plus', label: 'Qwen3.7-Plus', desc: '多模态 Agent · 最新' },
      { id: 'qwen3.7-max', label: 'Qwen3.7-Max', desc: '文本旗舰 · 1M 上下文' },
    ],
  },
  custom: {
    label: '自定义',
    defaultModel: '',
    defaultApiUrl: '',
    models: [],
  },
};
