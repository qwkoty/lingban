import type { User, Agent, ChatMessage, Session } from '../types';

const TOKEN_KEY = 'lingban_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(path, { ...options, headers });

  if (!res.ok) {
    let error = `请求失败 (${res.status})`;
    try {
      const body = await res.json();
      error = body.error || error;
    } catch {
      // ignore
    }
    throw new Error(error);
  }

  return res.json();
}

// Auth
export const api = {
  anonymousLogin: () =>
    request<{ token: string; user: User }>('/api/auth/anonymous', { method: 'POST' }),

  getMe: () => request<{ user: User }>('/api/auth/me'),

  updateMe: (data: Partial<Pick<User, 'nickname' | 'avatar' | 'persona' | 'theme'>>) =>
    request<{ user: User }>('/api/auth/me', { method: 'PATCH', body: JSON.stringify(data) }),

  // Agents
  getAgents: () => request<{ agents: Agent[] }>('/api/agents'),

  getAgent: (id: number) => request<{ agent: Agent }>(`/api/agents/${id}`),

  createAgent: (data: Partial<Agent>) =>
    request<{ agent: Agent }>('/api/agents', { method: 'POST', body: JSON.stringify(data) }),

  updateAgent: (id: number, data: Partial<Agent>) =>
    request<{ agent: Agent }>(`/api/agents/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deleteAgent: (id: number) =>
    request<{ success: boolean }>(`/api/agents/${id}`, { method: 'DELETE' }),

  // Chat
  getSessions: () => request<{ sessions: Session[] }>('/api/chat/sessions'),

  getHistory: (agentId: number) =>
    request<{ agent: Agent; messages: ChatMessage[] }>(`/api/chat/sessions/${agentId}`),

  clearHistory: (agentId: number) =>
    request<{ success: boolean }>(`/api/chat/${agentId}`, { method: 'DELETE' }),

  // Upload
  uploadAvatar: async (file: File) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/upload/avatar', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || '上传失败');
    }

    return res.json() as Promise<{ url: string }>;
  },
};

// 流式聊天：返回一个可取消的流式读取器
export interface StreamChatHandlers {
  onChunk: (text: string) => void;
  onError: (error: string) => void;
  onDone: (content: string, messageId?: number) => void;
}

export async function streamChat(
  agentId: number,
  message: string,
  handlers: StreamChatHandlers,
  signal?: AbortSignal,
) {
  const token = getToken();
  const res = await fetch(`/api/chat/${agentId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message }),
    signal,
  });

  if (!res.ok) {
    let error = `请求失败 (${res.status})`;
    try {
      const body = await res.json();
      error = body.error || error;
    } catch {
      // ignore
    }
    handlers.onError(error);
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    handlers.onError('无法读取响应流');
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let fullContent = '';
  let messageId: number | undefined;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;

      try {
        const data = JSON.parse(trimmed.slice(6));
        if (data.type === 'chunk') {
          fullContent += data.content;
          handlers.onChunk(data.content);
        } else if (data.type === 'error') {
          handlers.onError(data.error);
          return;
        } else if (data.type === 'done') {
          fullContent = data.content || fullContent;
          messageId = data.messageId;
        }
      } catch {
        // skip
      }
    }
  }

  handlers.onDone(fullContent, messageId);
}
