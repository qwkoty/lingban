import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MessageCircle, Users } from 'lucide-react';
import { useAgentsStore } from '../store/agents';
import { Avatar } from '../components/Avatar';
import { GlassCard } from '../components/GlassCard';
import { EmptyState } from '../components/EmptyState';
import { BottomNav } from '../components/BottomNav';
import { formatTime } from '../lib/utils';

export function AgentsPage() {
  const navigate = useNavigate();
  const { agents, loading, fetchAgents } = useAgentsStore();

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  return (
    <div className="min-h-dvh pb-20">
      <header className="sticky top-0 z-30 glass px-5 py-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <h1 className="text-xl font-semibold">我的好友</h1>
          <button
            onClick={() => navigate('/agent/new')}
            className="touch-target flex items-center justify-center w-10 h-10 rounded-xl glass hover:bg-white/10 transition-colors"
          >
            <Plus size={22} />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4">
        {loading && agents.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          </div>
        ) : agents.length === 0 ? (
          <EmptyState
            icon={<Users size={48} />}
            title="还没有 AI 好友"
            description="创建你的第一个 AI 好友，开始一段有趣的对话吧"
            action={
              <button
                onClick={() => navigate('/agent/new')}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 font-medium touch-target"
              >
                创建好友
              </button>
            }
          />
        ) : (
          <div className="space-y-3">
            {agents.map((agent) => (
              <GlassCard
                key={agent.id}
                onClick={() => navigate(`/chat/${agent.id}`)}
                className="flex items-center gap-3"
              >
                <Avatar src={agent.avatar} name={agent.name} size="lg" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium truncate">{agent.name}</h3>
                    <span className="text-xs text-white/40 flex-shrink-0 ml-2">
                      {formatTime(agent.updatedAt)}
                    </span>
                  </div>
                  <p className="text-sm text-white/40 truncate mt-0.5">
                    {agent.greeting || agent.persona.slice(0, 40) || '点击开始对话'}
                  </p>
                </div>
                <MessageCircle size={20} className="text-white/30 flex-shrink-0" />
              </GlassCard>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
