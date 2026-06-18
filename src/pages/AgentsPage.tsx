import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAgentsStore } from '../store/agents'
import Avatar from '../components/Avatar'
import GlassCard from '../components/GlassCard'
import EmptyState from '../components/EmptyState'
import { Plus, Pencil, Trash2, Bot, Cpu } from 'lucide-react'
import type { Agent } from '../types'

export default function AgentsPage() {
  const navigate = useNavigate()
  const { agents, loading, fetchAgents, deleteAgent } = useAgentsStore()

  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

  const handleDelete = async (e: React.MouseEvent, agent: Agent) => {
    e.stopPropagation()
    if (confirm(`确定删除「${agent.name}」吗?`)) {
      await deleteAgent(agent.id)
    }
  }

  return (
    <div className="min-h-screen pb-28 page-enter">
      {/* 顶部标题 */}
      <div className="px-6 pt-14 pb-4 flex items-center justify-between animate-fade-in-down">
        <h1 className="text-2xl font-bold font-display text-white/90">我的智能体</h1>
        <span className="text-xs text-white/30 glass px-3 py-1.5 rounded-full">{agents.length} 个</span>
      </div>

      {/* 智能体列表 */}
      <div className="px-4 space-y-3">
        {loading ? (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass rounded-4xl p-4 flex items-center gap-4">
                <div className="skeleton w-14 h-14 rounded-3xl" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-24 rounded-full" />
                  <div className="skeleton h-3 w-32 rounded-full" />
                </div>
              </div>
            ))}
          </>
        ) : agents.length === 0 ? (
          <EmptyState
            icon={<Bot size={32} className="text-white/30" />}
            title="还没有智能体"
            description="创建你的第一个智能体,开始对话之旅"
            action={
              <button
                onClick={() => navigate('/agents/new')}
                className="aurora-gradient text-white text-sm font-semibold px-6 py-3.5 rounded-3xl flex items-center gap-2 animate-bounce-soft"
              >
                <Plus size={18} />
                创建智能体
              </button>
            }
          />
        ) : (
          agents.map((agent, i) => (
            <div
              key={agent.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${i * 80}ms`, opacity: 0 }}
            >
              <GlassCard
                onClick={() => navigate(`/agents/${agent.id}/edit`)}
                className="p-4 flex items-center gap-4 hover-lift"
              >
                <Avatar src={agent.avatar} name={agent.name} size={56} />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white/90 truncate">{agent.name}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Cpu size={12} className="text-white/30" />
                    <span className="text-xs text-white/40 truncate">{agent.modelName}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/agents/${agent.id}/edit`)
                    }}
                    className="p-2.5 rounded-2xl hover:bg-white/10 transition-all text-white/40 hover:text-white/70 active:scale-90"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, agent)}
                    className="p-2.5 rounded-2xl hover:bg-red-500/10 transition-all text-white/40 hover:text-red-400 active:scale-90"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </GlassCard>
            </div>
          ))
        )}
      </div>

      {/* 悬浮创建按钮 */}
      {agents.length > 0 && (
        <button
          onClick={() => navigate('/agents/new')}
          className="fixed bottom-24 right-4 max-w-[480px] w-14 h-14 rounded-3xl aurora-gradient flex items-center justify-center shadow-lg shadow-aurora-blue/20 active:scale-90 transition-transform z-40 animate-bounce-soft"
          style={{ left: 'calc(50% + 240px - 64px)' }}
        >
          <Plus size={24} className="text-white" />
        </button>
      )}
    </div>
  )
}
