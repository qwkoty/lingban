import { Link, useLocation } from 'react-router-dom';
import { MessageCircle, Users, UserCircle } from 'lucide-react';
import { cn } from '../lib/utils';

const navItems = [
  { to: '/', icon: MessageCircle, label: '聊天' },
  { to: '/agents', icon: Users, label: '好友' },
  { to: '/profile', icon: UserCircle, label: '我的' },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-4 mb-4 rounded-3xl glass border border-white/10 shadow-2xl">
        <div className="flex items-center justify-around h-14">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 h-full transition-all duration-200',
                  active ? 'text-white scale-105' : 'text-white/50 hover:text-white/80'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] mt-0.5">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
