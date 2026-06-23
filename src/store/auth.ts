import { create } from 'zustand';
import type { User } from '@/types';
import { authApi } from '@/lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
  init: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  loading: false,
  initialized: false,
  error: null,

  init: async () => {
    if (get().initialized) return;

    set({ loading: true, error: null });

    try {
      const token = authApi.getToken();

      if (token) {
        try {
          const user = await authApi.me();
          set({ user, token, initialized: true, loading: false });
          return;
        } catch {
          // Token 失效，重新登录
          authApi.clearToken();
        }
      }

      // 匿名登录
      const user = await authApi.anonymous();
      const newToken = authApi.getToken();
      set({ user, token: newToken, initialized: true, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '初始化失败',
        initialized: true,
        loading: false,
      });
    }
  },

  updateUser: async (data) => {
    set({ loading: true, error: null });
    try {
      const updatedUser = await authApi.update(data);
      set({ user: updatedUser, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '更新失败',
        loading: false,
      });
      throw error;
    }
  },

  logout: () => {
    authApi.clearToken();
    set({ user: null, token: null, initialized: false });
  },
}));
