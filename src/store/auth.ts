import { create } from 'zustand';
import type { User } from '../types';
import { authApi } from '../lib/api';

interface AuthState {
  user: User | null;
  initialized: boolean;
  error: string | null;
  init: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  initialized: false,
  error: null,

  init: async () => {
    set({ error: null });
    try {
      const token = localStorage.getItem('lingban_token');
      if (!token) {
        const res = await authApi.anonymous();
        localStorage.setItem('lingban_token', res.token);
        set({ user: res.user, initialized: true, error: null });
        return;
      }

      try {
        const res = await authApi.me();
        set({ user: res.user, initialized: true, error: null });
      } catch {
        // token 失效或数据库已清空，自动重新匿名登录
        localStorage.removeItem('lingban_token');
        const res = await authApi.anonymous();
        localStorage.setItem('lingban_token', res.token);
        set({ user: res.user, initialized: true, error: null });
      }
    } catch (err) {
      localStorage.removeItem('lingban_token');
      set({
        user: null,
        initialized: true,
        error: err instanceof Error ? err.message : '登录失败，请检查网络或后端服务',
      });
    }
  },

  updateUser: async (data) => {
    const res = await authApi.updateMe(data);
    set({ user: res.user });
  },
}));
