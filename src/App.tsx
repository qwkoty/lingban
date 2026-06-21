import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth.js';
import { useThemeStore } from './store/theme.js';
import { BottomNav } from './components/BottomNav.js';
import { ChatPage } from './pages/ChatPage.js';
import { AgentsPage } from './pages/AgentsPage.js';
import { AgentEditPage } from './pages/AgentEditPage.js';
import { ProfilePage } from './pages/ProfilePage.js';

export default function App() {
  const { init, initialized, user } = useAuthStore();
  const { initTheme } = useThemeStore();

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (user) {
      initTheme(user.theme);
    }
  }, [user, initTheme]);

  if (!initialized) {
    return (
      <div className="flex items-center justify-center h-full aurora-bg">
        <div className="animate-spin w-10 h-10 border-2 border-white/20 border-t-white rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-full aurora-bg">
      <main className="h-full overflow-y-auto scrollbar-thin">
        <Routes>
          <Route path="/" element={<Navigate to="/chat" replace />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/agents" element={<AgentsPage />} />
          <Route path="/agents/new" element={<AgentEditPage />} />
          <Route path="/agents/:id/edit" element={<AgentEditPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/chat" replace />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
}
