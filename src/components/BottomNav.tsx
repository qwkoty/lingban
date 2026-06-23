import { NavLink } from 'react-router-dom';
import { Users, User } from 'lucide-react';
import { cn } from '../lib/utils';

export function BottomNav() {
  const items = [
    { to: '/', label: '好友', icon: Users },
    { to: '/profile', label: '我的', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass safe-bottom">
      <div className="flex items-center justify-around max-w-md mx-auto h-16">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-1 px-6 py-2 rounded-xl transition-colors touch-target',
                isActive ? 'text-white' : 'text-white/40',
              )
            }
          >
            <Icon size={22} />
            <span className="text-xs">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
