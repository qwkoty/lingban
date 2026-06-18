import { NavLink, useLocation } from 'react-router-dom'
import { User, Bot, MessageSquare } from 'lucide-react'
import { useEffect, useState } from 'react'

const tabs = [
  { path: '/profile', label: '我的', icon: User },
  { path: '/agents', label: '智能体', icon: Bot },
  { path: '/chat', label: '对话', icon: MessageSquare },
]

export default function BottomNav() {
  const location = useLocation()
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const idx = tabs.findIndex((t) => location.pathname.startsWith(t.path))
    setActiveIndex(idx >= 0 ? idx : 0)
  }, [location.pathname])

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50 safe-bottom">
      <div className="glass-nav mx-3 mb-3 px-3 py-2.5 flex items-center justify-around relative">
        {/* 滑块 */}
        <div
          className="absolute top-2 bottom-2 rounded-3xl transition-all duration-500 ease-out"
          style={{
            width: 'calc(33.333% - 6px)',
            left: `calc(${activeIndex * 33.333}% + 4px)`,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 4px 20px rgba(79,140,255,0.08)',
          }}
        />
        {tabs.map((tab, i) => {
          const Icon = tab.icon
          const isActive = activeIndex === i
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className="relative z-10 flex flex-col items-center justify-center gap-1 py-2 px-5 transition-all duration-500 ease-out"
              style={{
                transform: isActive ? 'scale(1.08)' : 'scale(1)',
                transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              <div
                className="transition-all duration-500"
                style={{
                  filter: isActive
                    ? 'drop-shadow(0 0 10px rgba(79,140,255,0.5))'
                    : 'none',
                }}
              >
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={isActive ? 'aurora-text' : 'text-white/40'}
                  style={{ transition: 'all 0.4s ease' }}
                />
              </div>
              <span
                className={`text-[10px] font-medium transition-all duration-500 ${
                  isActive ? 'aurora-text' : 'text-white/40'
                }`}
              >
                {tab.label}
              </span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
