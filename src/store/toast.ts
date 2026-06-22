import { create } from 'zustand';
import type { ToastMessage } from '../types';

interface ToastState {
  toasts: ToastMessage[];
  show: (message: string, type?: ToastMessage['type']) => void;
  remove: (id: string) => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  show: (message, type = 'info') => {
    const id = Math.random().toString(36).slice(2);
    set({ toasts: [...get().toasts, { id, message, type }] });
    setTimeout(() => get().remove(id), 3000);
  },
  remove: (id) => {
    set({ toasts: get().toasts.filter((t) => t.id !== id) });
  },
}));
