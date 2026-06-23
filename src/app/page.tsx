'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, MessageCircle, Trash2, Edit3 } from 'lucide-react';
import { useAgentsStore } from '@/store/agents';
import { useAuthStore } from '@/store/auth';
import { toast } from '@/store/toast';
import { GlassCard } from '@/components/GlassCard';
import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { BottomNav } from '@/components/BottomNav';
import { Modal } from '@/components/Modal';
import { useState } from 'react';

export default function AgentsPage() {
  const router = useRouter();
  const { agents, loading, fetchAgents, deleteAgent } = useAgentsStore();
  const user = useAuthStore((state) => state.user);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchAgents().catch(() => {});
    }
  }, [user, fetchAgents]);

  const handleDelete = async (id: string) => {
    try {
      await deleteAgent(id);
      toast.success('已删除');
      setDeleteId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '删除失败');
    }
  };

  return (
    <main className="min-h-dvh pb-nav">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/70 border-b border-border safe-area-top">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              灵伴
            </h1>
            <p className="text-xs text-muted-foreground">你的 AI 好友们</p>
          </div>
          <Link
            href="/agent/new"
            className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-secondary text-white shadow-lg shadow-primary/20 active:scale-95 transition-transform"
          >
            <Plus size={20} />
          </Link>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-4">
        {loading && agents.length === 0 ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : agents.length === 0 ? (
          <EmptyState
            icon={<MessageCircle size={40} />}
            title="还没有 AI 好友"
            description="创建你的第一个 AI 好友，开始聊天吧"
            action={
              <Link
                href="/agent/new"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-medium shadow-lg shadow-primary/20 active:scale-95 transition-transform"
              >
                <Plus size={18} />
                创建好友
              </Link>
            }
          />
        ) : (
          <div className="grid gap-3">
            {agents.map((agent) => (
              <GlassCard
                key={agent.id}
                hover
                className="p-4 cursor-pointer"
                onClick={() => router.push(`/agent/${agent.id}/chat`)}
              >
                <div className="flex items-center gap-3">
                  <Avatar src={agent.avatar} name={agent.name} size="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground truncate">
                        {agent.name}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                      {agent.persona || '暂无人设描述'}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => router.push(`/agent/${agent.id}/edit`)}
                      className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteId(agent.id)}
                      className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-destructive"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      <BottomNav />

      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="确认删除"
      >
        <p className="text-sm text-muted-foreground mb-6">
          删除后，这个 AI 好友和所有聊天记录都将消失，无法恢复。确定要删除吗？
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setDeleteId(null)}
            className="flex-1 py-2.5 rounded-xl border border-border text-foreground font-medium hover:bg-muted transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => deleteId && handleDelete(deleteId)}
            className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground font-medium hover:opacity-90 transition-opacity"
          >
            删除
          </button>
        </div>
      </Modal>
    </main>
  );
}
