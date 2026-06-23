'use client';

import { useEffect, useState } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ToastContainer } from '@/components/Toast';
import { useThemeStore } from '@/store/theme';
import { useAuthStore } from '@/store/auth';

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const initTheme = useThemeStore((state) => state.init);
  const initAuth = useAuthStore((state) => state.init);
  const authInitialized = useAuthStore((state) => state.initialized);
  const authLoading = useAuthStore((state) => state.loading);

  useEffect(() => {
    setMounted(true);
    initTheme();
    initAuth();
  }, [initTheme, initAuth]);

  if (!mounted || !authInitialized || authLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-white/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {children}
      <ToastContainer />
    </ErrorBoundary>
  );
}
