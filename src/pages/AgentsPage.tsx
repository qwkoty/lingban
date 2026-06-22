import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MessageCircle, Trash2, Settings } from 'lucide-react';
import { useAgentsStore } from '../store/agents';
import { useToastStore } from '../store/toast';
import { Avatar } from '../components/Avatar';
import { GlassCard } from '../components/GlassCard';
import { EmptyState } from '../components/EmptyState';

export function AgentsPage() {
  const navigate = useNavigate();
  const { agents, loading, fetchAgents, deleteAgent } = useAgentsStore();
  const showToast = useToastStore((s) => s.show);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`确定删除「${name}」吗？`)) return;
    try {
      await deleteAgent(id);
      showToast('已删除', 'success');
    } catch (err) {
      showToast((err as Error).message, 'error');
    }
  };

  return (
    <div className="min-h-full p-4">
      <header className="flex items-center justify-between mb-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-white">我的 AI 好友</h1>
          <p className="text-sm text-white/50">每个人都是独一无二的陪伴</p>
        </div>
        <button
          onClick={() => navigate('/agents/new')}
          className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </header>

      {loading && agents.length === 0 ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        </div>
      ) : agents.length === 0 ? (
        <EmptyState
          icon={<MessageCircle className="w-8 h-8" />}
          title="还没有 AI 好友"
          description="创建一个性格鲜明的智能体，开始聊天吧"
          action={
            <button
              onClick={() => navigate('/agents/new')}
              className="px-5 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white text-sm font-medium transition-colors"
            >
              创建 AI 好友
            </button>
          }
        />
      ) : (
        <div className="max-w-2xl mx-auto grid gap-3">
          {agents.map((agent) => (
            <GlassCard
              key={agent.id}
              className="p-4 flex items-center gap-4 group cursor-pointer"
              onClick={() => navigate(`/?agent=${agent.id}`)}
            >
              <Avatar src={agent.avatar} name={agent.name} size="md" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white truncate">{agent.name}</h3>
                <p className="text-sm text-white/50 truncate">
                  {agent.persona || '还没写人设'}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/agents/${agent.id}/edit`);
                  }}
                  className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(agent.id, agent.name);
                  }}
                  className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-red-300 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
