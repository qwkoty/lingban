import { create } from 'zustand';
import type { User, Theme } from '../types.js';
import { authApi } from '../lib/api.js';

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  init: () => Promise<void>;
  updateUser: (data: { nickname?: string; avatar?: string; persona?: string; theme?: Theme }) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  initialized: false,

  init: async () => {
    try {
      let token = localStorage.getItem('lingban_token');
      if (!token) {
        const res = await authApi.anonymous();
        token = res.token;
        localStorage.setItem('lingban_token', token);
        set({ user: res.user, loading: false, initialized: true });
      } else {
        const res = await authApi.me();
        set({ user: res.user, loading: false, initialized: true });
      }
    } catch {
      localStorage.removeItem('lingban_token');
      set({ user: null, loading: false, initialized: true });
    }
  },

  updateUser: async (data) => {
    const res = await authApi.updateMe(data);
    set({ user: res.user });
  },
}));
