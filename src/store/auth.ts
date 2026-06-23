import { create } from 'zustand';
import type { User } from '../types';
import { api, getToken, setToken, clearToken } from '../lib/api';

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  init: () => Promise<void>;
  updateProfile: (data: Partial<Pick<User, 'nickname' | 'avatar' | 'persona' | 'theme'>>) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  initialized: false,

  init: async () => {
    set({ loading: true });
    try {
      const token = getToken();
      if (token) {
        const { user } = await api.getMe();
        set({ user, loading: false, initialized: true });
        return;
      }
      // 首次访问：匿名登录
      const { token: newToken, user } = await api.anonymousLogin();
      setToken(newToken);
      set({ user, loading: false, initialized: true });
    } catch {
      clearToken();
      set({ user: null, loading: false, initialized: true });
    }
  },

  updateProfile: async (data) => {
    const { user } = await api.updateMe(data);
    set({ user });
  },

  logout: () => {
    clearToken();
    set({ user: null });
  },
}));
