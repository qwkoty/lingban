'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, User, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: '好友', icon: MessageSquare },
    { href: '/agent/new', label: '新建', icon: Plus, primary: true },
    { href: '/profile', label: '我的', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/80 backdrop-blur-xl safe-area-bottom">
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === '/' 
            ? pathname === '/' 
            : pathname.startsWith(item.href);

          if (item.primary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center -mt-6"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/30 text-white active:scale-95 transition-transform">
                  <Icon size={24} />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 px-4 py-2 min-w-[64px]"
            >
              <Icon
                size={22}
                className={cn(
                  'transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              />
              <span
                className={cn(
                  'text-xs transition-colors',
                  isActive ? 'text-primary font-medium' : 'text-muted-foreground'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
