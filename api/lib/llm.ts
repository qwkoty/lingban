import type { Agent } from '../../src/generated/prisma/client.ts';

const DEFAULT_ENDPOINTS: Record<string, string> = {
  openai: 'https://api.openai.com/v1/chat/completions',
  deepseek: 'https://api.deepseek.com/chat/completions',
  anthropic: '',
  custom: '',
};

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export function getEndpoint(agent: Pick<Agent, 'modelProvider' | 'apiEndpoint'>): string {
  if (agent.modelProvider === 'custom' || agent.modelProvider === 'anthropic') {
    if (!agent.apiEndpoint) {
      throw new Error('请先在智能体设置中配置 API 端点（apiEndpoint）');
    }
    return agent.apiEndpoint;
  }
  return DEFAULT_ENDPOINTS[agent.modelProvider] || DEFAULT_ENDPOINTS.deepseek;
}

export interface StreamChatOptions {
  agent: Pick<Agent, 'modelProvider' | 'modelName' | 'apiEndpoint' | 'apiKey' | 'temperature' | 'maxTokens'>;
  messages: LLMMessage[];
  onChunk: (text: string) => void;
  signal?: AbortSignal;
}

export async function streamChat({ agent, messages, onChunk, signal }: StreamChatOptions): Promise<string> {
  if (!agent.apiKey) {
    throw new Error('请先在智能体设置中配置 API Key');
  }

  const endpoint = getEndpoint(agent);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${agent.apiKey}`,
    },
    body: JSON.stringify({
      model: agent.modelName,
      messages,
      temperature: agent.temperature,
      max_tokens: agent.maxTokens,
      stream: true,
    }),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    let message = `LLM 请求失败 (${response.status})`;
    if (response.status === 401) {
      message = 'API Key 无效或已过期，请检查智能体设置';
    } else if (response.status === 429) {
      message = '请求过于频繁或额度不足，请稍后重试';
    } else if (errorText) {
      message = `${message}: ${errorText.slice(0, 200)}`;
    }
    throw new Error(message);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('LLM 返回了空的响应体');
  }

  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;

      const data = trimmed.slice(6);
      if (data === '[DONE]') continue;

      try {
        const json = JSON.parse(data);
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) {
          fullText += delta;
          onChunk(delta);
        }
      } catch {
        // 跳过无法解析的行
      }
    }
  }

  return fullText;
}

export function buildSystemPrompt(agent: Pick<Agent, 'name' | 'persona' | 'greeting'>, userPersona: string): string {
  const parts: string[] = [];

  parts.push(`你是「${agent.name}」，一个 AI 好友。`);

  if (agent.persona) {
    parts.push(`\n# 你的性格与人设\n${agent.persona}`);
  }

  parts.push('\n# 行为准则');
  parts.push('- 始终保持角色一致，用符合性格的语气和方式与用户交流。');
  parts.push('- 主动关心用户，找话题聊天，而不是被动等待提问。');
  parts.push('- 回复自然口语化，避免机械感，不要暴露你是 AI 模型。');

  if (userPersona) {
    parts.push(`\n# 用户的人设\n${userPersona}`);
  }

  return parts.join('\n');
}
