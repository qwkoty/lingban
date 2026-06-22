import type { User, Agent, ChatMessage, ChatSession } from '../types';

const API_BASE = '';

function getToken() {
  return localStorage.getItem('lingban_token') || '';
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    try {
      const body = JSON.parse(text);
      const msg = body.detail || body.error || text;
      throw new Error(msg || `Request failed: ${res.status}`);
    } catch {
      throw new Error(text || `Request failed: ${res.status}`);
    }
  }

  return res.json() as Promise<T>;
}

export const authApi = {
  anonymous: () => request<{ token: string; user: User }>('/api/auth/anonymous', { method: 'POST' }),
  me: () => request<{ user: User }>('/api/auth/me'),
  updateMe: (data: Partial<User>) =>
    request<{ user: User }>('/api/auth/me', { method: 'PATCH', body: JSON.stringify(data) }),
};

export const agentsApi = {
  list: () => request<{ agents: Agent[] }>('/api/agents'),
  get: (id: number) => request<{ agent: Agent }>(`/api/agents/${id}`),
  create: (data: Partial<Agent>) =>
    request<{ agent: Agent }>('/api/agents', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Agent>) =>
    request<{ agent: Agent }>(`/api/agents/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<{ success: boolean }>(`/api/agents/${id}`, { method: 'DELETE' }),
};

export const chatApi = {
  sessions: () => request<{ sessions: ChatSession[] }>('/api/chat/sessions'),
  history: (agentId: number) =>
    request<{ messages: ChatMessage[] }>(`/api/chat/sessions/${agentId}`),
  clear: (agentId: number) =>
    request<{ success: boolean }>(`/api/chat/sessions/${agentId}`, { method: 'DELETE' }),
  send: (
    agentId: number,
    message: string,
    onChunk: (chunk: { content?: string; error?: string }) => void,
    onDone: () => void
  ) => {
    fetch(`${API_BASE}/api/chat/${agentId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ message }),
    })
      .then(async (response) => {
        const reader = response.body?.getReader();
        if (!reader) {
          onChunk({ error: '无法读取响应' });
          onDone();
          return;
        }

        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;

            const data = trimmed.slice(5).trim();
            if (data === '[DONE]') {
              onDone();
              return;
            }

            try {
              onChunk(JSON.parse(data));
            } catch {
              // ignore
            }
          }
        }
        onDone();
      })
      .catch((err) => {
        onChunk({ error: err.message });
        onDone();
      });
  },
};

export const uploadApi = {
  avatar: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/upload/avatar', {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'Upload failed');
    }

    return res.json() as Promise<{ url: string }>;
  },
};
