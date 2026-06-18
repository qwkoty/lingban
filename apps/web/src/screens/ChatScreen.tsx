import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { api } from '../api/client';
import { useTheme } from '../theme/useTheme';
import { avatarGradients } from '../theme/colors';
import type { Agent, Conversation } from '../types';

let tempIdCounter = 0;
function generateTempId(): number {
  tempIdCounter += 1;
  return -tempIdCounter;
}

function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.error || err.message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return 'Unknown error';
}

export function ChatScreen() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { colors } = useTheme();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [agent, setAgent] = useState<Agent | null>(null);
  const [messages, setMessages] = useState<Conversation[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get(`/api/agents/${id}`).then((res) => setAgent(res.data.agent));
    api.get(`/api/agents/${id}/conversations`).then((res) => setMessages(res.data.conversations || []));
  }, [id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !id || sending) return;
    const text = input.trim();
    setInput('');
    setSending(true);

    // 乐观更新，使用负数临时 ID 避免与后端返回的正数 ID 冲突
    const optimistic: Conversation = {
      id: generateTempId(),
      agentId: Number(id),
      sessionId: 'default',
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await api.post(`/api/agents/${id}/chat`, { message: text, sessionId: 'default' });
      const reply: Conversation = {
        id: generateTempId(),
        agentId: Number(id),
        sessionId: 'default',
        role: 'assistant',
        content: res.data.reply,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, reply]);
    } catch (err: unknown) {
      alert('发送失败: ' + getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const getGradient = (avatarUrl?: string) => {
    const g = avatarGradients.find((x) => x.id === avatarUrl);
    return g ? g.colors : avatarGradients[0].colors;
  };

  if (!agent) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textSecondary }}>加载中...</div>;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: `1px solid ${colors.border}`, background: colors.background }}>
        <button onClick={() => navigate('/agents')} style={{ background: 'none', border: 'none', color: colors.text, fontSize: 20, cursor: 'pointer', marginRight: 12 }}>←</button>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg, ${getGradient(agent.avatarUrl)[0]}, ${getGradient(agent.avatarUrl)[1]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: colors.textInverse, marginRight: 10 }}>
          {agent.name.charAt(0)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{agent.name}</div>
          <div style={{ fontSize: 11, color: colors.textSecondary }}>{agent.model}</div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div key={msg.id} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '80%', padding: '12px 16px', borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: isUser ? `linear-gradient(135deg, ${colors.gradient[0]}, ${colors.gradient[1]})` : colors.surface,
                color: isUser ? colors.textInverse : colors.text,
                border: isUser ? 'none' : `1px solid ${colors.border}`,
                fontSize: 14, lineHeight: 1.6, wordBreak: 'break-word',
              }}>
                {msg.content}
              </div>
            </div>
          );
        })}
        {sending && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '10px 16px', borderRadius: '18px 18px 18px 4px', background: colors.surface, border: `1px solid ${colors.border}` }}>
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: colors.textSecondary, marginRight: 4, animation: 'blink 1s infinite' }} />
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: colors.textSecondary, marginRight: 4, animation: 'blink 1s infinite 0.2s' }} />
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: colors.textSecondary, animation: 'blink 1s infinite 0.4s' }} />
            </div>
          </div>
        )}
        <style>{`
          @keyframes blink { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
        `}</style>
      </div>

      {/* Input */}
      <div style={{ padding: '10px 16px 20px', borderTop: `1px solid ${colors.border}`, background: colors.background, display: 'flex', gap: 10 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="输入消息..."
          style={{
            flex: 1, height: 44, borderRadius: 22, padding: '0 18px',
            border: `1px solid ${colors.border}`, background: colors.inputBackground,
            color: colors.text, fontSize: 14, outline: 'none',
          }}
        />
        <button
          onClick={sendMessage}
          disabled={sending || !input.trim()}
          style={{
            width: 44, height: 44, borderRadius: '50%', border: 'none',
            background: `linear-gradient(135deg, ${colors.gradient[0]}, ${colors.gradient[1]})`,
            color: colors.textInverse, fontSize: 18, fontWeight: 700,
            cursor: 'pointer', opacity: sending || !input.trim() ? 0.5 : 1,
          }}
        >
          →
        </button>
      </div>
    </div>
  );
}
