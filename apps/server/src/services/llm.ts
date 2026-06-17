export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionResponse {
  reply: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

const PRESETS: Record<string, { apiUrl: string; defaultModel: string }> = {
  deepseek: {
    apiUrl: 'https://api.deepseek.com/v1/chat/completions',
    defaultModel: 'deepseek-chat',
  },
  nvidia: {
    apiUrl: 'https://integrate.api.nvidia.com/v1/chat/completions',
    defaultModel: 'meta/llama3-70b-instruct',
  },
  qwen: {
    apiUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    defaultModel: 'qwen-turbo',
  },
};

export async function chatWithLLM(options: {
  provider: string;
  model: string;
  apiKey: string;
  apiUrl?: string | null;
  messages: ChatMessage[];
  temperature: number;
  maxTokens: number;
}): Promise<ChatCompletionResponse> {
  const { provider, model, apiKey, apiUrl, messages, temperature, maxTokens } = options;

  const url = apiUrl || PRESETS[provider]?.apiUrl;
  if (!url) {
    throw new Error(`Unknown provider: ${provider}`);
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || PRESETS[provider]?.defaultModel,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];
  const reply = choice?.message?.content || '';
  const usage = data.usage;

  return {
    reply,
    usage: usage
      ? {
          promptTokens: usage.prompt_tokens || 0,
          completionTokens: usage.completion_tokens || 0,
          totalTokens: usage.total_tokens || 0,
        }
      : undefined,
  };
}
