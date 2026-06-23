import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Palette } from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { useThemeStore } from '../store/theme';
import { toast } from '../store/toast';
import { Avatar } from '../components/Avatar';
import { GlassCard } from '../components/GlassCard';
import { BottomNav } from '../components/BottomNav';
import { api } from '../lib/api';
import { cn } from '../lib/utils';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuthStore();
  const { theme, setTheme } = useThemeStore();

  const [nickname, setNickname] = useState(user?.nickname || '');
  const [persona, setPersona] = useState(user?.persona || '');
  const [avatar, setAvatar] = useState(user?.avatar || null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!nickname.trim()) {
      toast.error('昵称不能为空');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ nickname: nickname.trim(), persona, avatar });
      toast.success('保存成功');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { url } = await api.uploadAvatar(file);
      setAvatar(url);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="min-h-dvh pb-20">
      <header className="sticky top-0 z-30 glass px-5 py-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="touch-target flex items-center justify-center w-10 h-10 rounded-xl hover:bg-white/10"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-semibold">我的</h1>
          <button
            onClick={handleSave}
            disabled={saving}
            className="touch-target flex items-center justify-center w-10 h-10 rounded-xl hover:bg-white/10 disabled:opacity-40"
          >
            <Check size={20} />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* 头像 */}
        <div className="flex flex-col items-center gap-3">
          <label className="cursor-pointer">
            <Avatar src={avatar} name={nickname || '我'} size="xl" />
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          </label>
          <p className="text-sm text-white/40">点击头像更换</p>
        </div>

        {/* 基本信息 */}
        <GlassCard className="space-y-4">
          <div>
            <label className="text-sm text-white/50 mb-1.5 block">昵称</label>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="给自己起个名字"
              className="w-full bg-white/5 rounded-xl px-4 py-3 outline-none focus:bg-white/10 transition-colors"
            />
          </div>
          <div>
            <label className="text-sm text-white/50 mb-1.5 block">人设（让 AI 更懂你）</label>
            <textarea
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              placeholder="例如：喜欢玩游戏、正在学编程、性格内向但话多..."
              rows={3}
              className="w-full bg-white/5 rounded-xl px-4 py-3 outline-none focus:bg-white/10 transition-colors resize-none"
            />
          </div>
        </GlassCard>

        {/* 主题 */}
        <GlassCard>
          <div className="flex items-center gap-2 mb-3">
            <Palette size={18} className="text-white/60" />
            <span className="font-medium">主题</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {([
              { key: 'aurora', label: '极光', gradient: 'from-[#0f0c29] via-[#302b63] to-[#24243e]' },
              { key: 'colorful', label: '七彩', gradient: 'from-[#1a1a2e] via-[#0f3460] to-[#533483]' },
            ] as const).map((t) => (
              <button
                key={t.key}
                onClick={() => {
                  setTheme(t.key);
                  updateProfile({ theme: t.key });
                }}
                className={cn(
                  'h-20 rounded-xl bg-gradient-to-br relative overflow-hidden transition-all',
                  t.gradient,
                  theme === t.key ? 'ring-2 ring-white/60' : 'ring-1 ring-white/10',
                )}
              >
                <span className="absolute bottom-2 left-3 text-sm font-medium">{t.label}</span>
              </button>
            ))}
          </div>
        </GlassCard>
      </main>

      <BottomNav />
    </div>
  );
}
