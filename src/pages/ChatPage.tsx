import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Send, Bot, MessageSquare, Plus } from 'lucide-react';
import { useChatStore } from '../store/chat.js';
import { useAgentsStore } from '../store/agents.js';
import { Avatar } from '../components/Avatar.js';
import { GlassCard } from '../components/GlassCard.js';
import { EmptyState } from '../components/EmptyState.js';

export function ChatPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedAgentId = searchParams.get('agent')
    ? Number(searchParams.get('agent'))
    : null;

  const { agents, fetchAgents } = useAgentsStore();
  const { sessions, messages, loading, streaming, fetchSessions, fetchHistory, sendMessage } =
    useChatStore();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAgents();
    fetchSessions();
  }, [fetchAgents, fetchSessions]);

  useEffect(() => {
    if (selectedAgentId) {
      fetchHistory(selectedAgentId);
    }
  }, [selectedAgentId, fetchHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  const handleSend = async () => {
    if (!input.trim() || !selectedAgentId || streaming) return;
    const text = input.trim();
    setInput('');
    await sendMessage(selectedAgentId, text, () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  };

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);

  if (!selectedAgentId) {
    return (
      <div className="p-4 pb-28 max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold gradient-text">对话</h1>
          <button
            onClick={() => navigate('/agents/new')}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>

        {sessions.length === 0 && agents.length === 0 ? (
          <EmptyState
            icon={<MessageSquare size={48} />}
            title="还没有对话"
            description="先创建一个智能体，然后开始聊天吧"
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
                onClick={() => setSearchParams({ agent: String(agent.id) })}
              >
                <Avatar src={agent.avatar} name={agent.name} />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{agent.name}</h3>
                  <p className="text-white/40 text-sm truncate">{agent.modelName}</p>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-md mx-auto">
      <div className="flex items-center gap-3 p-4 glass-strong rounded-none rounded-b-2xl">
        <button
          onClick={() => setSearchParams({})}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <Avatar src={selectedAgent?.avatar} name={selectedAgent?.name || 'AI'} size="sm" />
        <div className="flex-1 min-w-0">
          <h2 className="font-medium truncate">{selectedAgent?.name || '智能体'}</h2>
          <p className="text-white/40 text-xs truncate">{selectedAgent?.modelName}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full" />
          </div>
        ) : messages.length === 0 ? (
          <EmptyState
            icon={<Bot size={48} />}
            title="开始对话"
            description="发送第一条消息，与智能体开始交流"
          />
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded-br-md'
                    : 'glass rounded-bl-md'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 pb-28">
        <div className="flex items-center gap-2 glass-strong p-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="输入消息..."
            disabled={streaming}
            className="flex-1 bg-transparent px-3 py-2 outline-none text-sm placeholder:text-white/30"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || streaming}
            className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center disabled:opacity-40 transition-opacity"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
