import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/auth'
import { authApi } from '../lib/api'
import Avatar from '../components/Avatar'
import GlassCard from '../components/GlassCard'
import Modal from '../components/Modal'
import { ChevronRight, Edit3, Info, Sparkles, Check, X, Shield, FileText, AlertCircle } from 'lucide-react'

type ModalType = 'about' | 'disclaimer' | 'privacy' | null

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore()
  const [editing, setEditing] = useState(false)
  const [nickname, setNickname] = useState('')
  const [modal, setModal] = useState<ModalType>(null)

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
      <div className="px-6 pt-14 pb-4 animate-fade-in-down">
        <h1 className="text-2xl font-bold font-display text-white/90">我的</h1>
      </div>

      {/* 用户信息卡片 */}
      <div className="px-4">
        <GlassCard strong className="p-6 relative overflow-hidden animate-scale-in">
          {/* 渐变光晕 */}
          <div className="absolute -top-16 -right-16 w-48 h-48 aurora-gradient rounded-full blur-3xl opacity-15 animate-breathing" />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 aurora-gradient rounded-full blur-3xl opacity-10 animate-float" />

          <div className="relative flex items-center gap-4">
            <div className="animate-breathing">
              <Avatar src={user.avatar} name={user.nickname} size={72} />
            </div>
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="flex items-center gap-2 animate-fade-in">
                  <input
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    autoFocus
                    className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 text-lg font-semibold text-white/90 flex-1 min-w-0"
                    placeholder="输入昵称"
                  />
                  <button
                    onClick={handleSave}
                    className="p-2.5 rounded-2xl aurora-gradient text-white active:scale-90 transition-transform"
                  >
                    <Check size={18} />
                  </button>
                  <button
                    onClick={() => { setEditing(false); setNickname(user.nickname) }}
                    className="p-2.5 rounded-2xl glass text-white/60 active:scale-90 transition-transform"
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white/90 truncate">{user.nickname}</h2>
                  <button
                    onClick={() => setEditing(true)}
                    className="p-1.5 rounded-xl glass text-white/30 hover:text-white/60 transition-all active:scale-90"
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
        <h3 className="text-xs font-medium text-white/30 px-2 mb-2 uppercase tracking-wider animate-fade-in-up" style={{ animationDelay: '100ms', opacity: 0 }}>设置</h3>

        <div className="animate-fade-in-up" style={{ animationDelay: '150ms', opacity: 0 }}>
          <GlassCard className="p-0 overflow-hidden">
            <SettingItem icon={<Sparkles size={18} />} label="主题色" value="极光渐变" />
            <div className="h-px bg-white/5 mx-4" />
            <SettingItem icon={<Info size={18} />} label="关于灵伴" value="v1.0.0" onClick={() => setModal('about')} />
          </GlassCard>
        </div>

        {/* 法律条款 */}
        <h3 className="text-xs font-medium text-white/30 px-2 mb-2 mt-6 uppercase tracking-wider animate-fade-in-up" style={{ animationDelay: '200ms', opacity: 0 }}>法律与隐私</h3>

        <div className="animate-fade-in-up" style={{ animationDelay: '250ms', opacity: 0 }}>
          <GlassCard className="p-0 overflow-hidden">
            <SettingItem icon={<AlertCircle size={18} />} label="免责声明" onClick={() => setModal('disclaimer')} />
            <div className="h-px bg-white/5 mx-4" />
            <SettingItem icon={<Shield size={18} />} label="隐私条款" onClick={() => setModal('privacy')} />
          </GlassCard>
        </div>

        {/* 流光色带 */}
        <div className="px-2 pt-6 animate-fade-in-up" style={{ animationDelay: '350ms', opacity: 0 }}>
          <div className="h-1.5 rounded-full aurora-gradient opacity-40" />
        </div>
      </div>

      {/* 关于灵伴 */}
      <Modal open={modal === 'about'} onClose={() => setModal(null)} title="关于灵伴">
        <div className="space-y-5">
          {/* 应用图标和名称 */}
          <div className="flex flex-col items-center py-4">
            <div className="relative mb-4">
              <div className="absolute inset-0 aurora-gradient rounded-4xl blur-xl opacity-30 animate-breathing" />
              <div className="relative w-20 h-20 rounded-4xl aurora-gradient flex items-center justify-center animate-float">
                <span className="text-3xl font-bold text-white font-display">灵</span>
              </div>
            </div>
            <h3 className="text-xl font-bold font-display text-white/90">灵伴</h3>
            <p className="text-sm text-white/40 mt-1">版本 1.0.0</p>
          </div>

          <InfoRow label="应用名称" value="灵伴" />
          <InfoRow label="版本号" value="1.0.0" />
          <InfoRow label="应用类型" value="纯网页端应用" />
          <InfoRow label="技术栈" value="React + Express + SQLite" />

          <div className="glass rounded-3xl p-4">
            <p className="text-sm text-white/60 leading-relaxed">
              灵伴是一款极简、高级的 AI 智能体应用。用户可以自定义专属智能体,配置人设、模型参数与 API 密钥,并与智能体进行流畅的多轮对话。
            </p>
          </div>

          <p className="text-center text-xs text-white/30 pt-2">
            Made with <span className="aurora-text font-semibold">Aurora</span>
          </p>
        </div>
      </Modal>

      {/* 免责声明 */}
      <Modal open={modal === 'disclaimer'} onClose={() => setModal(null)} title="免责声明">
        <div className="space-y-4 text-sm text-white/60 leading-relaxed">
          <Section title="服务性质">
            灵伴仅作为工具提供 AI 智能体的创建与对话功能,应用本身不提供任何 AI 模型服务。所有 AI 回复均由用户配置的第三方模型 API(如 DeepSeek)生成,灵伴不对任何 AI 生成内容的准确性、完整性或适用性作出保证。
          </Section>

          <Section title="用户责任">
            用户需自行配置有效的 API Key,并承担相应的 API 调用费用。用户应自行判断 AI 生成内容的可靠性,并对基于 AI 建议采取的任何行动承担全部责任。
          </Section>

          <Section title="内容免责">
            AI 生成的内容可能存在错误、偏见或不适当的内容。灵伴不对这些内容负责。如遇不良内容,请停止使用并自行判断。
          </Section>

          <Section title="服务变更">
            灵伴保留随时修改、暂停或终止部分或全部服务的权利,无需另行通知。
          </Section>

          <Section title="第三方服务">
            本应用依赖第三方 API 服务,其服务可用性、计费方式、隐私政策等由第三方独立管理,灵伴不对其承担任何责任。
          </Section>

          <p className="text-xs text-white/30 pt-2">最后更新:2026 年 6 月</p>
        </div>
      </Modal>

      {/* 隐私条款 */}
      <Modal open={modal === 'privacy'} onClose={() => setModal(null)} title="隐私条款">
        <div className="space-y-4 text-sm text-white/60 leading-relaxed">
          <Section title="匿名登录">
            灵伴采用匿名登录机制,无需注册账号或提供个人身份信息。系统会自动分配一个递增的用户 ID 和随机 Token 用于标识您的身份,Token 仅存储在您的本地浏览器中。
          </Section>

          <Section title="数据存储">
            您创建的智能体配置(名称、人设、模型参数、API Key)和对话记录会存储在服务器本地数据库中。这些数据与您的匿名 ID 关联,不会与任何真实身份绑定。
          </Section>

          <Section title="API Key 安全">
            您输入的 API Key 会保存在服务器数据库中,用于代理调用第三方模型 API。API Key 不会在客户端明文展示,但请注意本应用为自托管部署,请确保运行环境的安全。
          </Section>

          <Section title="对话数据">
            您与智能体的对话内容会持久化保存,以便您随时查看历史记录。这些数据仅用于对话功能,不会用于其他用途。
          </Section>

          <Section title="数据删除">
            您可以随时删除智能体,删除后该智能体及其所有对话记录将被永久删除。如需删除账户相关数据,请清除本地 Token(退出登录)。
          </Section>

          <Section title="Cookie 与本地存储">
            本应用仅在浏览器本地存储中保存登录 Token,不使用 Cookie 进行追踪。清除浏览器数据将导致您无法访问之前的账户。
          </Section>

          <Section title="数据共享">
            灵伴不会将您的数据共享、出售或传输给任何第三方。您的对话内容仅在调用模型 API 时传输至您配置的第三方服务。
          </Section>

          <Section title="儿童隐私">
            本应用不面向 13 岁以下儿童。我们不会故意收集儿童的个人信息。
          </Section>

          <Section title="条款变更">
            本隐私条款可能不时更新。更新后,我们会在应用内提示您查阅。继续使用即视为您同意更新后的条款。
          </Section>

          <p className="text-xs text-white/30 pt-2">最后更新:2026 年 6 月</p>
        </div>
      </Modal>
    </div>
  )
}

function SettingItem({ icon, label, value, onClick }: { icon: React.ReactNode; label: string; value?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-4 transition-all duration-300 active:scale-[0.98] ${onClick ? 'hover:bg-white/5 cursor-pointer' : ''}`}
    >
      <div className="text-white/40">{icon}</div>
      <span className="flex-1 text-sm text-white/70">{label}</span>
      {value && <span className="text-xs text-white/30">{value}</span>}
      <ChevronRight size={16} className="text-white/20" />
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm text-white/40">{label}</span>
      <span className="text-sm text-white/80">{value}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-3xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <FileText size={14} className="text-aurora-blue/60" />
        <h4 className="text-sm font-semibold text-white/80">{title}</h4>
      </div>
      <p className="text-sm text-white/55 leading-relaxed">{children}</p>
    </div>
  )
}
