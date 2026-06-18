import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/auth'
import BottomNav from './components/BottomNav'
import ProfilePage from './pages/ProfilePage'
import AgentsPage from './pages/AgentsPage'
import AgentEditPage from './pages/AgentEditPage'
import ChatPage from './pages/ChatPage'

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, initialized, loginAnonymous, loading } = useAuthStore()

  useEffect(() => {
    if (!user && initialized && !loading) {
      loginAnonymous()
    }
  }, [user, initialized, loginAnonymous, loading])

  if (!initialized || (!user && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center aurora-bg">
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="absolute inset-0 aurora-gradient rounded-4xl blur-xl opacity-40 animate-breathing" />
            <div className="relative w-20 h-20 rounded-4xl aurora-gradient flex items-center justify-center animate-float">
              <span className="text-3xl font-bold text-white font-display">灵</span>
            </div>
          </div>
          <p className="text-sm text-white/40 animate-pulse-soft">正在进入...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center aurora-bg gap-8">
        <div className="relative">
          <div className="absolute inset-0 aurora-gradient rounded-4xl blur-xl opacity-40 animate-breathing" />
          <div className="relative w-20 h-20 rounded-4xl aurora-gradient flex items-center justify-center animate-float">
            <span className="text-3xl font-bold text-white font-display">灵</span>
          </div>
        </div>
        <button
          onClick={() => loginAnonymous()}
          className="aurora-gradient text-white font-semibold px-10 py-4 rounded-3xl animate-bounce-soft shadow-lg shadow-aurora-blue/20"
        >
          开始使用
        </button>
      </div>
    )
  }

  return <>{children}</>
}

export default function App() {
  const { init } = useAuthStore()

  useEffect(() => {
    init()
  }, [init])

  return (
    <Router>
      <div className="aurora-bg min-h-screen">
        <div className="max-w-[480px] mx-auto min-h-screen relative">
          <AuthGate>
            <Routes>
              <Route path="/" element={<Navigate to="/chat" replace />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/agents" element={<AgentsPage />} />
              <Route path="/agents/new" element={<AgentEditPage />} />
              <Route path="/agents/:id/edit" element={<AgentEditPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="*" element={<Navigate to="/chat" replace />} />
            </Routes>
            <BottomNav />
          </AuthGate>
        </div>
      </div>
    </Router>
  )
}
