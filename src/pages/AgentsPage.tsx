import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit, Bot } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAgentsStore } from '../store/agents.js';
import { Avatar } from '../components/Avatar.js';
import { GlassCard } from '../components/GlassCard.js';
import { EmptyState } from '../components/EmptyState.js';
import { Modal } from '../components/Modal.js';

export function AgentsPage() {
  const navigate = useNavigate();
  const { agents, loading, fetchAgents, deleteAgent } = useAgentsStore();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const handleDelete = async () => {
    if (deletingId === null) return;
    await deleteAgent(deletingId);
    setDeletingId(null);
  };

  return (
    <div className="p-4 pb-28 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold gradient-text">智能体</h1>
        <button
          onClick={() => navigate('/agents/new')}
          className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
        >
          <Plus size={20} />
        </button>
      </div>

      {loading && agents.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="glass h-24 animate-pulse bg-white/5"
            />
          ))}
        </div>
      ) : agents.length === 0 ? (
        <EmptyState
          icon={<Bot size={48} />}
          title="还没有智能体"
          description="创建一个智能体，开始你的 AI 对话"
          action={
            <button
              onClick={() => navigate('/agents/new')}
              className="px-6 py-2 rounded-full bg-white/10 hover:bg-white/15 transition-colors"
            >
              创建智能体
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {agents.map((agent, index) => (
            <GlassCard
              key={agent.id}
              hover
              className="flex items-center gap-4 animate-fade-in-up"
              style={{ animationDelay: `${index * 0.05}s` }}
              onClick={() => navigate(`/agents/${agent.id}/edit`)}
            >
              <Avatar src={agent.avatar} name={agent.name} />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{agent.name}</h3>
                <p className="text-white/40 text-sm truncate">{agent.modelName}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/agents/${agent.id}/edit`);
                  }}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingId(agent.id);
                  }}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors text-red-400"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      <Modal
        open={deletingId !== null}
        onClose={() => setDeletingId(null)}
        title="删除智能体"
      >
        <p className="text-white/60 mb-6">确定要删除这个智能体吗？相关的对话记录也会被删除。</p>
        <div className="flex gap-3">
          <button
            onClick={() => setDeletingId(null)}
            className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/15 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleDelete}
            className="flex-1 py-3 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors"
          >
            删除
          </button>
        </div>
      </Modal>
    </div>
  );
}
