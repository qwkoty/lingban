import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import { useThemeStore } from './store/theme';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastContainer } from './components/Toast';
import { AgentsPage } from './pages/AgentsPage';
import { AgentEditPage } from './pages/AgentEditPage';
import { ChatPage } from './pages/ChatPage';
import { ProfilePage } from './pages/ProfilePage';

function AppRoutes() {
  const { init: initAuth, initialized, loading } = useAuthStore();
  const { init: initTheme } = useThemeStore();

  useEffect(() => {
    initTheme();
    initAuth();
  }, [initAuth, initTheme]);

  if (!initialized || loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<AgentsPage />} />
      <Route path="/agent/new" element={<AgentEditPage />} />
      <Route path="/agent/:id/edit" element={<AgentEditPage />} />
      <Route path="/chat/:agentId" element={<ChatPage />} />
      <Route path="/profile" element={<ProfilePage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
        <ToastContainer />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
