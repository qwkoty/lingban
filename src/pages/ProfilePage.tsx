import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/auth'
import { authApi } from '../lib/api'
import Avatar from '../components/Avatar'
import GlassCard from '../components/GlassCard'
import { ChevronRight, Edit3, Info, Sparkles } from 'lucide-react'

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore()
  const [editing, setEditing] = useState(false)
  const [nickname, setNickname] = useState('')

  useEffect(() => {
    if (user) setNickname(user.nickname)
  }, [user])

  const handleSave = async () => {
    if (!nickname.trim()) return
    try {
      const { user: updated } = await authApi.updateMe({ nickname: nickname.trim() })
      updateUser(updated)
      setEditing(false)
    } catch {
      // 忽略错误
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen pb-28 page-enter">
      {/* 顶部标题 */}
      <div className="px-6 pt-14 pb-4">
        <h1 className="text-2xl font-bold font-display text-white/90">我的</h1>
      </div>

      {/* 用户信息卡片 */}
      <div className="px-4">
        <GlassCard strong className="p-6 relative overflow-hidden">
          {/* 渐变光晕 */}
          <div className="absolute -top-12 -right-12 w-40 h-40 aurora-gradient rounded-full blur-3xl opacity-15 animate-breathing" />

          <div className="relative flex items-center gap-4">
            <div className="animate-breathing">
              <Avatar src={user.avatar} name={user.nickname} size={72} />
            </div>
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="flex items-center gap-2">
                  <input
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    autoFocus
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-lg font-semibold text-white/90 flex-1 min-w-0"
                    placeholder="输入昵称"
                  />
                  <button
                    onClick={handleSave}
                    className="text-xs aurora-text font-semibold px-3 py-1.5 glass rounded-xl"
                  >
                    保存
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white/90 truncate">{user.nickname}</h2>
                  <button
                    onClick={() => setEditing(true)}
                    className="text-white/30 hover:text-white/60 transition-colors"
                  >
                    <Edit3 size={14} />
                  </button>
                </div>
              )}
              <p className="text-sm text-white/40 mt-1">ID: {user.id}</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* 设置列表 */}
      <div className="px-4 mt-6 space-y-2">
        <h3 className="text-xs font-medium text-white/30 px-2 mb-2 uppercase tracking-wider">设置</h3>

        <GlassCard className="p-0 overflow-hidden">
          <SettingItem icon={<Sparkles size={18} />} label="主题色" value="极光渐变" />
          <div className="h-px bg-white/5 mx-4" />
          <SettingItem icon={<Info size={18} />} label="关于灵伴" value="v1.0.0" />
        </GlassCard>

        {/* 流光色带 */}
        <div className="px-2 pt-4">
          <div className="h-1.5 rounded-full aurora-gradient opacity-40" />
        </div>
      </div>
    </div>
  )
}

function SettingItem({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-4 hover:bg-white/5 transition-colors">
      <div className="text-white/40">{icon}</div>
      <span className="flex-1 text-sm text-white/70">{label}</span>
      {value && <span className="text-xs text-white/30">{value}</span>}
      <ChevronRight size={16} className="text-white/20" />
    </div>
  )
}
