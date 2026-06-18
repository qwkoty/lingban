import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useTheme } from '../theme/useTheme';
import { avatarGradients } from '../theme/colors';
import type { Agent } from '../types';

export function AgentsListScreen() {
  const navigate = useNavigate();
  const { colors } = useTheme();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/agents').then((res) => {
      setAgents(res.data.agents || []);
      setLoading(false);
    });
  }, []);

  const deleteAgent = async (id: number) => {
    if (!confirm('确定要删除这个智能体吗？')) return;
    await api.delete(`/api/agents/${id}`);
    setAgents((prev) => prev.filter((a) => a.id !== id));
  };

  const getGradient = (avatarUrl?: string) => {
    const g = avatarGradients.find((x) => x.id === avatarUrl);
    return g ? g.colors : avatarGradients[0].colors;
  };

  return (
    <div style={{ minHeight: '100vh', padding: 20, paddingBottom: 100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>我的智能体</h1>
        <button
          onClick={() => navigate('/agents/new')}
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: 'none',
            background: `linear-gradient(135deg, ${colors.gradient[0]}, ${colors.gradient[1]})`,
            color: colors.textInverse,
            fontSize: 24,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: `0 4px 20px ${colors.gradient[0]}44`,
          }}
        >
          +
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: colors.textSecondary }}>加载中...</div>
      ) : agents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: colors.textSecondary }}>
          还没有智能体，点击右下角 + 创建一个
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {agents.map((agent) => {
            const grad = getGradient(agent.avatarUrl);
            return (
              <div
                key={agent.id}
                onClick={() => navigate(`/chat/${agent.id}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: 16,
                  borderRadius: 18,
                  background: colors.surface,
                  border: `1px solid ${colors.border}`,
                  cursor: 'pointer',
                  backdropFilter: 'blur(20px)',
                  transition: 'transform 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(0.99)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${grad[0]}, ${grad[1]})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    fontWeight: 700,
                    color: colors.textInverse,
                    flexShrink: 0,
                    marginRight: 14,
                  }}
                >
                  {agent.name.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {agent.name}
                  </div>
                  <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                    {agent.model}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/agents/edit/${agent.id}`);
                  }}
                  style={{
                    marginRight: 8,
                    padding: '6px 12px',
                    borderRadius: 10,
                    border: `1px solid ${colors.border}`,
                    background: colors.inputBackground,
                    color: colors.text,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  编辑
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteAgent(agent.id);
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 10,
                    border: `1px solid ${colors.border}`,
                    background: colors.inputBackground,
                    color: colors.danger,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  删除
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
