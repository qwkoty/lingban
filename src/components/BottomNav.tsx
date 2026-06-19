import { NavLink } from 'react-router-dom';
import { MessageSquare, Bot, User } from 'lucide-react';
import { cn } from '../lib/utils.js';

const items = [
  { to: '/chat', icon: MessageSquare, label: '对话' },
  { to: '/agents', icon: Bot, label: '智能体' },
  { to: '/profile', icon: User, label: '我的' },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md">
      <div className="glass-strong px-2 py-2 flex items-center justify-around">
        {items.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all duration-300',
                isActive
                  ? 'text-white bg-white/15'
                  : 'text-white/50 hover:text-white/80'
              )
            }
          >
            <Icon size={20} />
            <span className="text-[10px]">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
