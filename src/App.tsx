import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import { useThemeStore } from './store/theme';
import { ChatPage } from './pages/ChatPage';
import { AgentsPage } from './pages/AgentsPage';
import { AgentEditPage } from './pages/AgentEditPage';
import { ProfilePage } from './pages/ProfilePage';
import { BottomNav } from './components/BottomNav';
import { ToastContainer } from './components/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';

export function App() {
  const { user, initialized, init } = useAuthStore();
  const initTheme = useThemeStore((s) => s.initTheme);

  useEffect(() => {
    init();
    initTheme(user?.theme);
  }, [init, initTheme, user?.theme]);

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center gap-4">
        <p className="text-white/60">无法获取用户信息</p>
        <button
          onClick={init}
          className="px-5 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white text-sm font-medium transition-colors"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-full pb-24">
        <Routes>
          <Route path="/" element={<ChatPage />} />
          <Route path="/agents" element={<AgentsPage />} />
          <Route path="/agents/new" element={<AgentEditPage />} />
          <Route path="/agents/:id/edit" element={<AgentEditPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <BottomNav />
        <ToastContainer />
      </div>
    </ErrorBoundary>
  );
}
