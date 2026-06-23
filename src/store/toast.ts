import { create } from 'zustand';
import type { ToastMessage } from '@/types';

interface ToastState {
  toasts: ToastMessage[];
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  dismiss: (id: string) => void;
}

let idCounter = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  success: (message) => {
    const id = String(++idCounter);
    set((state) => ({
      toasts: [...state.toasts, { id, type: 'success', message }],
    }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 3000);
  },

  error: (message) => {
    const id = String(++idCounter);
    set((state) => ({
      toasts: [...state.toasts, { id, type: 'error', message }],
    }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },

  info: (message) => {
    const id = String(++idCounter);
    set((state) => ({
      toasts: [...state.toasts, { id, type: 'info', message }],
    }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 3000);
  },

  dismiss: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));

// 导出一个独立的 toast 对象，方便在非组件中使用
export const toast = {
  success: (message: string) => useToastStore.getState().success(message),
  error: (message: string) => useToastStore.getState().error(message),
  info: (message: string) => useToastStore.getState().info(message),
};
