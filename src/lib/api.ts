import type { Agent, ChatMessage, User } from '@/types';

const BASE_URL = '/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('lingban_token');
}

function setToken(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('lingban_token', token);
}

function clearToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('lingban_token');
}

interface RequestOptions extends RequestInit {
  requireAuth?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { requireAuth = true, headers, ...rest } = options;

  const authHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (requireAuth) {
    const token = getToken();
    if (token) {
      authHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: {
      ...authHeaders,
      ...headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `请求失败 (${response.status})`);
  }

  return data as T;
}

// Auth API
export const authApi = {
  async anonymous() {
    const data = await request<{ user: User; token: string }>('/auth/anonymous', {
      method: 'POST',
      requireAuth: false,
    });
    setToken(data.token);
    return data.user;
  },

  async me() {
    return request<User>('/auth/me', { method: 'GET' });
  },

  async update(data: Partial<Pick<User, 'nickname' | 'avatar' | 'persona' | 'theme'>>) {
    return request<User>('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  getToken,
  setToken,
  clearToken,
};

// Agents API
export const agentsApi = {
  async list() {
    return request<Agent[]>('/agents', { method: 'GET' });
  },

  async create(data: Partial<Agent>) {
    return request<Agent>('/agents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async get(id: string) {
    return request<Agent>(`/agents/${id}`, { method: 'GET' });
  },

  async update(id: string, data: Partial<Agent>) {
    return request<Agent>(`/agents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string) {
    return request<{ success: boolean }>(`/agents/${id}`, { method: 'DELETE' });
  },
};

// Chat API
export const chatApi = {
  async getMessages(agentId: string) {
    return request<ChatMessage[]>(`/chat/${agentId}/messages`, { method: 'GET' });
  },

  async clearHistory(agentId: string) {
    return request<{ success: boolean }>(`/chat/${agentId}/messages`, { method: 'DELETE' });
  },

  streamSend(
    agentId: string,
    content: string,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const token = getToken();
      if (!token) {
        reject(new Error('未登录'));
        return;
      }

      const eventSource = new EventSourcePolyfill(
        `${BASE_URL}/chat/${agentId}/send`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content }),
        }
      );

      let fullContent = '';
      let hasError = false;

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'chunk') {
            fullContent += data.content;
            onChunk(data.content);
          } else if (data.type === 'done') {
            eventSource.close();
            resolve(fullContent || data.content);
          } else if (data.type === 'error') {
            hasError = true;
            eventSource.close();
            reject(new Error(data.error || '请求失败'));
          }
        } catch {
          // 忽略解析错误
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        if (!hasError) {
          reject(new Error('连接中断'));
        }
      };
    });
  },

  streamRegenerate(
    agentId: string,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const token = getToken();
      if (!token) {
        reject(new Error('未登录'));
        return;
      }

      const eventSource = new EventSourcePolyfill(
        `${BASE_URL}/chat/${agentId}/regenerate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        }
      );

      let fullContent = '';
      let hasError = false;

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'chunk') {
            fullContent += data.content;
            onChunk(data.content);
          } else if (data.type === 'done') {
            eventSource.close();
            resolve(fullContent || data.content);
          } else if (data.type === 'error') {
            hasError = true;
            eventSource.close();
            reject(new Error(data.error || '请求失败'));
          }
        } catch {
          // 忽略解析错误
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        if (!hasError) {
          reject(new Error('连接中断'));
        }
      };
    });
  },
};

// EventSource Polyfill for POST support
class EventSourcePolyfill extends EventTarget {
  private url: string;
  private options: RequestInit;
  private readyState: number;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private controller: AbortController | null = null;

  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 2;

  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onopen: ((event: Event) => void) | null = null;

  constructor(url: string, options: RequestInit = {}) {
    super();
    this.url = url;
    this.options = options;
    this.readyState = EventSourcePolyfill.CONNECTING;
    this.init();
  }

  private async init() {
    try {
      this.controller = new AbortController();
      const response = await fetch(this.url, {
        ...this.options,
        signal: this.controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      this.readyState = EventSourcePolyfill.OPEN;
      this.dispatchEvent(new Event('open'));
      if (this.onopen) this.onopen(new Event('open'));

      this.reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await this.reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);
          const event = new MessageEvent('message', { data });
          this.dispatchEvent(event);
          if (this.onmessage) this.onmessage(event);
        }
      }

      this.readyState = EventSourcePolyfill.CLOSED;
    } catch {
      this.readyState = EventSourcePolyfill.CLOSED;
      this.dispatchEvent(new Event('error'));
      if (this.onerror) this.onerror(new Event('error'));
    }
  }

  close() {
    if (this.controller) {
      this.controller.abort();
    }
    this.readyState = EventSourcePolyfill.CLOSED;
  }
}
