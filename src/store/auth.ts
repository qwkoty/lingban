import { create } from 'zustand'
import type { User } from '../types'
import { authApi, getToken, setToken, clearToken } from '../lib/api'

interface AuthState {
  user: User | null
  loading: boolean
  initialized: boolean
  init: () => Promise<void>
  loginAnonymous: () => Promise<void>
  updateUser: (user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  initialized: false,

  init: async () => {
    const token = getToken()
    if (!token) {
      set({ initialized: true })
      return
    }
    try {
      const { user } = await authApi.me()
      set({ user, initialized: true })
    } catch {
      clearToken()
      set({ user: null, initialized: true })
    }
  },

  loginAnonymous: async () => {
    set({ loading: true })
    try {
      const { token, user } = await authApi.anonymous()
      setToken(token)
      set({ user, loading: false })
    } catch {
      set({ loading: false })
      throw new Error('登录失败')
    }
  },

  updateUser: (user: User) => set({ user }),

  logout: () => {
    clearToken()
    set({ user: null })
  },
}))
