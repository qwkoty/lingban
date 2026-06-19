import { useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useAuthStore } from '../store/auth.js';
import { Avatar } from '../components/Avatar.js';
import { GlassCard } from '../components/GlassCard.js';
import { uploadApi } from '../lib/api.js';

export function ProfilePage() {
  const { user, init, updateUser } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState(user?.nickname || '');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (user) setNickname(user.nickname);
  }, [user]);

  const handleSave = async () => {
    await updateUser({ nickname });
    setEditing(false);
  };

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { url } = await uploadApi.avatar(file);
    await updateUser({ avatar: url });
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

          <p className="text-white/40 text-sm mt-2">ID: {user.id}</p>
        </GlassCard>
      </div>

      <GlassCard className="space-y-4">
        <div className="flex items-center gap-3">
          <Sparkles className="text-yellow-400" size={20} />
          <div>
            <p className="font-medium">灵伴 AI 智能体</p>
            <p className="text-white/40 text-sm">v1.0.0</p>
          </div>
        </div>
        <p className="text-white/40 text-sm leading-relaxed">
          创建属于你的 AI 智能体，随时随地开启对话。所有数据安全存储，无需注册即可使用。
        </p>
      </GlassCard>
    </div>
  );
}
