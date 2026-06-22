import { create } from 'zustand';
import type { User } from '../types';
import { authApi } from '../lib/api';

interface AuthState {
  user: User | null;
  initialized: boolean;
  init: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  initialized: false,

  init: async () => {
    try {
      let token = localStorage.getItem('lingban_token');
      if (!token) {
        const res = await authApi.anonymous();
        token = res.token;
        localStorage.setItem('lingban_token', token);
        set({ user: res.user, initialized: true });
      } else {
        const res = await authApi.me();
        set({ user: res.user, initialized: true });
      }
    } catch {
      localStorage.removeItem('lingban_token');
      set({ user: null, initialized: true });
    }
  },

  updateUser: async (data) => {
    const res = await authApi.updateMe(data);
    set({ user: res.user });
  },
}));
