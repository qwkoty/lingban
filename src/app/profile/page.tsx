'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { useThemeStore } from '@/store/theme';
import { toast } from '@/store/toast';
import { GlassCard } from '@/components/GlassCard';
import { Avatar } from '@/components/Avatar';
import { BottomNav } from '@/components/BottomNav';
import {
  User,
  Palette,
  Sparkles,
  ChevronRight,
  Save,
  Moon,
  Sun,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ThemeType } from '@/types';

export default function ProfilePage() {
  const { user, updateUser, loading } = useAuthStore();
  const { theme, setTheme } = useThemeStore();

  const [nickname, setNickname] = useState(user?.nickname || '');
  const [persona, setPersona] = useState(user?.persona || '');
  const [editing, setEditing] = useState(false);

  const themes: { value: ThemeType; label: string; icon: typeof Sun }[] = [
    { value: 'aurora', label: '极光', icon: Sun },
    { value: 'dark', label: '暗夜', icon: Moon },
  ];

  const handleSave = async () => {
    try {
      await updateUser({ nickname: nickname.trim(), persona });
      toast.success('已保存');
      setEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败');
    }
  };

  return (
    <main className="min-h-dvh pb-nav">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/70 border-b border-border safe-area-top">
        <div className="max-w-md mx-auto px-4 py-4">
          <h1 className="text-xl font-bold">我的</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* 用户资料卡片 */}
        <GlassCard className="p-5">
          <div className="flex items-center gap-4 mb-5">
            <Avatar src={user?.avatar || null} name={user?.nickname || '我'} size="xl" />
            <div className="flex-1 min-w-0">
              {editing ? (
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full text-lg font-semibold bg-transparent border-b border-border focus:border-primary outline-none py-1 text-foreground"
                />
              ) : (
                <h2 className="text-lg font-semibold text-foreground">
                  {user?.nickname}
                </h2>
              )}
              <p className="text-sm text-muted-foreground">匿名用户</p>
            </div>
            <button
              onClick={editing ? handleSave : () => setEditing(true)}
              disabled={loading}
              className="p-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              {editing ? <Save size={18} /> : <User size={18} />}
            </button>
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
              <Sparkles size={14} />
              我的人设
            </label>
            {editing ? (
              <textarea
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
                placeholder="简单介绍一下你自己，让 AI 好友更了解你..."
                rows={3}
                className="w-full px-3 py-2 rounded-xl bg-muted border border-transparent focus:border-primary focus:outline-none transition-colors text-foreground text-sm"
              />
            ) : (
              <p className="text-sm text-foreground/80 leading-relaxed">
                {user?.persona || '还没有设置人设，点击编辑介绍一下自己吧～'}
              </p>
            )}
          </div>
        </GlassCard>

        {/* 主题设置 */}
        <GlassCard className="overflow-hidden">
          <div className="p-4 border-b border-border/50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Palette size={20} />
            </div>
            <div>
              <h3 className="font-medium text-foreground">主题</h3>
              <p className="text-xs text-muted-foreground">选择你喜欢的外观</p>
            </div>
          </div>
          <div className="p-3 grid grid-cols-2 gap-2">
            {themes.map((t) => {
              const Icon = t.icon;
              const active = theme === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  className={cn(
                    'p-3 rounded-xl flex items-center gap-2 transition-all border',
                    active
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-transparent border-transparent hover:bg-muted text-muted-foreground'
                  )}
                >
                  <Icon size={18} />
                  <span className="text-sm font-medium">{t.label}</span>
                </button>
              );
            })}
          </div>
        </GlassCard>

        {/* 关于 */}
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="font-medium text-foreground">灵伴</h3>
                <p className="text-xs text-muted-foreground">v1.0.0</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-muted-foreground" />
          </div>
        </GlassCard>
      </div>

      <BottomNav />
    </main>
  );
}
