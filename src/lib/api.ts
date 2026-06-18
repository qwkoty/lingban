import type { User, Agent, ChatMessage, ChatSession, AgentFormData } from '../types'

const TOKEN_KEY = 'lingban_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

function authHeaders(): Record<string, string> {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...options.headers,
    },
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || '请求失败')
  }
  return data as T
}

// 认证 API
export const authApi = {
  anonymous: () =>
    request<{ token: string; user: User }>('/api/auth/anonymous', { method: 'POST' }),

  me: () =>
    request<{ user: User }>('/api/auth/me'),

  updateMe: (data: { nickname?: string; avatar?: string }) =>
    request<{ user: User }>('/api/auth/me', { method: 'PATCH', body: JSON.stringify(data) }),
}

// 智能体 API
export const agentApi = {
  list: () =>
    request<{ agents: Agent[] }>('/api/agents'),

  get: (id: number) =>
    request<{ agent: Agent }>(`/api/agents/${id}`),

  create: (data: AgentFormData) =>
    request<{ agent: Agent }>('/api/agents', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: number, data: Partial<AgentFormData>) =>
    request<{ agent: Agent }>(`/api/agents/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: (id: number) =>
    request<{ success: boolean }>(`/api/agents/${id}`, { method: 'DELETE' }),
}

// 对话 API
export const chatApi = {
  sessions: () =>
    request<{ sessions: ChatSession[] }>('/api/chat/sessions'),

  messages: (agentId: number) =>
    request<{ agent: { id: number; name: string; avatar: string | null; persona: string }; messages: ChatMessage[] }>(`/api/chat/sessions/${agentId}`),

  // SSE 流式对话
  sendMessage: (agentId: number, message: string, onChunk: (content: string) => void, onError: (error: string) => void, onDone: () => void) => {
    const controller = new AbortController()

    fetch(`/api/chat/${agentId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify({ message }),
      signal: controller.signal,
    }).then(async (res) => {
      if (!res.ok) {
        const data = await res.json()
        onError(data.error || '请求失败')
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data: ')) continue
          const data = trimmed.slice(6)
          if (data === '[DONE]') {
            onDone()
            return
          }
          try {
            const parsed = JSON.parse(data)
            if (parsed.content) {
              onChunk(parsed.content)
            }
            if (parsed.error) {
              onError(parsed.error)
              return
            }
          } catch {
            // 忽略解析错误
          }
        }
      }
      onDone()
    }).catch((err) => {
      if (err.name !== 'AbortError') {
        onError(err.message || '网络错误')
      }
    })

    return controller
  },
}

// 上传 API
export const uploadApi = {
  avatar: (base64Image: string) =>
    request<{ url: string }>('/api/upload/avatar', {
      method: 'POST',
      body: JSON.stringify({ image: base64Image }),
    }),
}
