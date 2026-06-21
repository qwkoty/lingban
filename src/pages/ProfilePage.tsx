import { useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useAuthStore } from '../store/auth.js';
import { useThemeStore } from '../store/theme.js';
import { Avatar } from '../components/Avatar.js';
import { GlassCard } from '../components/GlassCard.js';
import { uploadApi } from '../lib/api.js';
import type { Theme } from '../types.js';

const themes: { value: Theme; label: string; preview: string }[] = [
  {
    value: 'aurora',
    label: '极光渐变',
    preview: 'from-indigo-900 via-blue-900 to-slate-900',
  },
  {
    value: 'colorful',
    label: '七彩渐变',
    preview: 'from-purple-900 via-pink-900 to-orange-900',
  },
];

export function ProfilePage() {
  const { user, init, updateUser } = useAuthStore();
  const { setTheme, theme } = useThemeStore();
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [persona, setPersona] = useState(user?.persona || '');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (user) {
      setNickname(user.nickname);
      setPersona(user.persona);
    }
  }, [user]);

  const handleSave = async () => {
    await updateUser({ nickname, persona });
    setEditing(false);
  };

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { url } = await uploadApi.avatar(file);
    await updateUser({ avatar: url });
  };

  const handleThemeChange = async (value: Theme) => {
    setTheme(value);
    await updateUser({ theme: value });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-4 pb-28 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6 gradient-text">我的</h1>

      <div className="relative mb-6">
        <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-2xl rounded-full" />
        <GlassCard className="relative flex flex-col items-center py-8">
          <button
            onClick={() => fileRef.current?.click()}
            className="relative group mb-4"
          >
            <Avatar src={user.avatar} name={user.nickname} size="xl" />
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs">
              更换
            </div>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatar}
          />

          {editing ? (
            <div className="flex items-center gap-2 w-full max-w-xs">
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="flex-1 bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-center outline-none focus:border-white/30"
                autoFocus
              />
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-white/15 rounded-lg hover:bg-white/20 transition-colors"
              >
                保存
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="text-xl font-semibold hover:opacity-80"
            >
              {user.nickname}
            </button>
          )}
        </GlassCard>
      </div>

      <div className="space-y-4">
        <GlassCard className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-2">我的人设</label>
            <textarea
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              onBlur={() => updateUser({ persona })}
              placeholder="描述你自己，比如身份、性格、说话方式…智能体会根据你的人设与你对话"
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/30 transition-colors resize-none text-sm"
            />
          </div>
        </GlassCard>

        <GlassCard className="space-y-4">
          <label className="block text-sm text-white/60">主题色</label>
          <div className="grid grid-cols-2 gap-3">
            {themes.map(({ value, label, preview }) => (
              <button
                key={value}
                onClick={() => handleThemeChange(value)}
                className={`relative overflow-hidden rounded-2xl p-4 text-left border transition-all ${
                  theme === value
                    ? 'border-white/40 ring-2 ring-white/20'
                    : 'border-white/10 hover:border-white/30'
                }`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${preview} opacity-60`}
                />
                <div className="relative z-10">
                  <div className="w-full h-12 rounded-xl bg-gradient-to-r from-white/20 via-white/10 to-white/20 mb-3" />
                  <span className="text-sm font-medium">{label}</span>
                </div>
              </button>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="space-y-4">
          <div className="flex items-center gap-3">
            <Sparkles className="text-yellow-400" size={20} />
            <div>
              <p className="font-medium">灵伴 AI 智能体</p>
              <p className="text-white/40 text-sm">v1.0.0</p>
            </div>
          </div>
          <p className="text-white/40 text-sm leading-relaxed">
            创建属于你的 AI 智能体，随时随地开启对话。设置你的人设和主题色，让每次聊天都更贴合你的风格。
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
