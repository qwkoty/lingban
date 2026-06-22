import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Camera, Moon, Sun } from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { useThemeStore } from '../store/theme';
import { useToastStore } from '../store/toast';
import { uploadApi } from '../lib/api';
import { Avatar } from '../components/Avatar';
import type { Theme } from '../types';

const themes: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'aurora', label: '极光', icon: Moon },
  { value: 'colorful', label: '七彩', icon: Sun },
];

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const showToast = useToastStore((s) => s.show);

  const [nickname, setNickname] = useState(user?.nickname ?? '');
  const [persona, setPersona] = useState(user?.persona ?? '');
  const [avatar, setAvatar] = useState(user?.avatar ?? '');
  const [memorySnapshot, setMemorySnapshot] = useState(user?.memorySnapshot ?? '');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { url } = await uploadApi.avatar(file);
      setAvatar(url);
      await updateUser({ avatar: url });
      showToast('头像上传成功', 'success');
    } catch (err) {
      showToast((err as Error).message, 'error');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUser({ nickname, persona, memorySnapshot });
      showToast('已保存', 'success');
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = (t: Theme) => {
    setTheme(t);
    updateUser({ theme: t });
  };

  return (
    <div className="min-h-full p-4 pb-28">
      <header className="flex items-center gap-3 mb-6 max-w-2xl mx-auto">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-white">我的资料</h1>
      </header>

      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex flex-col items-center gap-3">
          <button type="button" onClick={handleAvatarClick} className="relative group">
            <Avatar src={avatar} name={nickname || '我'} size="xl" />
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div className="glass rounded-2xl border border-white/10 p-4 space-y-4">
          <div>
            <label className="block text-sm text-white/70 mb-1">昵称</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:border-white/30 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-1">我的人设</label>
            <textarea
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              placeholder="你希望 AI 好友怎么看待你？比如职业、性格、兴趣等"
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:border-white/30 transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-1">关于我的记忆</label>
            <textarea
              value={memorySnapshot}
              onChange={(e) => setMemorySnapshot(e.target.value)}
              placeholder="AI 好友会记住这些内容。也可以让它在聊天中自动整理。"
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:border-white/30 transition-colors resize-none"
            />
            <p className="text-xs text-white/40 mt-1">这些记忆会在每次对话前告诉 AI 好友。</p>
          </div>
        </div>

        <div className="glass rounded-2xl border border-white/10 p-4">
          <label className="block text-sm text-white/70 mb-3">主题</label>
          <div className="flex gap-3">
            {themes.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => handleThemeChange(t.value)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${
                  theme === t.value
                    ? 'bg-white/20 border-white/30 text-white'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 rounded-2xl font-medium text-white bg-white/15 hover:bg-white/25 disabled:opacity-50 transition-all active:scale-[0.98]"
        >
          {saving ? '保存中…' : '保存'}
        </button>
      </div>
    </div>
  );
}
