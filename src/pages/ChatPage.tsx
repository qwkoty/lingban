import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Send,
  Trash2,
  RefreshCw,
  MessageSquarePlus,
  ChevronLeft,
  Copy,
  MoreVertical,
} from 'lucide-react';
import { useChatStore } from '../store/chat';
import { useAgentsStore } from '../store/agents';
import { useToastStore } from '../store/toast';
import { Avatar } from '../components/Avatar';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { cn } from '../lib/utils';

export function ChatPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const agentId = Number(searchParams.get('agent')) || 0;

  const { agents, fetchAgents } = useAgentsStore();
  const { sessions, messages, loading, streaming, fetchSessions, fetchHistory, clearHistory, sendMessage, regenerate } =
    useChatStore();
  const showToast = useToastStore((s) => s.show);

  const [input, setInput] = useState('');
  const [showClearModal, setShowClearModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchAgents();
    fetchSessions();
  }, [fetchAgents, fetchSessions]);

  useEffect(() => {
    if (agentId) {
      fetchHistory(agentId);
    }
  }, [agentId, fetchHistory]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeAgent = agents.find((a) => a.id === agentId) || sessions[0]?.agent;

  useEffect(() => {
    if (!agentId && activeAgent) {
      setSearchParams({ agent: String(activeAgent.id) });
    }
  }, [agentId, activeAgent, setSearchParams]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || !agentId || streaming) return;

    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    sendMessage(agentId, text, () => {
      // force re-render via store
    }).catch((err: Error) => {
      showToast(err.message, 'error');
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    target.style.height = 'auto';
    target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
  };

  const handleClear = async () => {
    if (!agentId) return;
    try {
      await clearHistory(agentId);
      setShowClearModal(false);
      showToast('对话已清空', 'success');
    } catch (err) {
      showToast((err as Error).message, 'error');
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('已复制', 'success');
    } catch {
      showToast('复制失败', 'error');
    }
  };

  const handleRegenerate = () => {
    if (!agentId || streaming) return;
    regenerate(agentId, () => {}).catch((err: Error) => showToast(err.message, 'error'));
  };

  if (!agentId && agents.length === 0) {
    return (
      <div className="min-h-full p-4">
        <EmptyState
          icon={<MessageSquarePlus className="w-8 h-8" />}
          title="还没有 AI 好友"
          description="创建一个智能体，开始像朋友一样聊天吧"
          action={
            <button
              onClick={() => navigate('/agents/new')}
              className="px-5 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white text-sm font-medium transition-colors"
            >
              创建 AI 好友
            </button>
          }
        />
      </div>
    );
  }

  if (!agentId || !activeAgent) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col">
      <header className="sticky top-0 z-40 px-4 py-3 glass-strong border-b border-white/10">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/agents')} className="p-2 -ml-2 rounded-full hover:bg-white/10 lg:hidden">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <Avatar src={activeAgent.avatar} name={activeAgent.name} size="sm" />
            <div>
              <h1 className="font-semibold text-white">{activeAgent.name}</h1>
              <p className="text-xs text-white/50">AI 好友</p>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowMenu((v) => !v)}
              className="p-2 rounded-full hover:bg-white/10"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-2 w-40 rounded-2xl glass border border-white/10 shadow-xl overflow-hidden animate-fade-in-up">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    handleRegenerate();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-white hover:bg-white/10"
                >
                  <RefreshCw className="w-4 h-4" /> 重新生成
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowClearModal(true);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-300 hover:bg-white/10"
                >
                  <Trash2 className="w-4 h-4" /> 清空对话
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {showMenu && (
        <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
      )}

      <main className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {loading && messages.length === 0 ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              const isLast = idx === messages.length - 1;
              return (
                <div
                  key={msg.id}
                  className={cn(
                    'flex gap-3 animate-fade-in-up',
                    isUser ? 'flex-row-reverse' : 'flex-row'
                  )}
                >
                  {isUser ? (
                    <Avatar src={undefined} name="我" size="sm" />
                  ) : (
                    <Avatar src={activeAgent.avatar} name={activeAgent.name} size="sm" />
                  )}
                  <div
                    className={cn(
                      'group relative max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed',
                      isUser
                        ? 'bg-white/15 text-white rounded-tr-sm'
                        : 'glass text-white/90 rounded-tl-sm'
                    )}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    {!isUser && isLast && (
                      <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleCopy(msg.content)}
                          className="p-1 rounded hover:bg-white/10 text-white/50"
                          title="复制"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={handleRegenerate}
                          className="p-1 rounded hover:bg-white/10 text-white/50"
                          title="重新生成"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          {streaming && (
            <div className="flex gap-3 animate-pulse">
              <Avatar src={activeAgent.avatar} name={activeAgent.name} size="sm" />
              <div className="glass px-4 py-3 rounded-2xl rounded-tl-sm text-white/50 text-sm">
                正在输入…
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </main>

      <div className="sticky bottom-0 z-40 px-4 pb-4 pt-2 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="max-w-2xl mx-auto glass rounded-3xl border border-white/10 shadow-2xl p-2 flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder={`给 ${activeAgent.name} 发消息…`}
            rows={1}
            className="flex-1 bg-transparent px-3 py-2.5 text-sm text-white placeholder-white/40 resize-none max-h-[120px] outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || streaming}
            className="mb-1 mr-1 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      <Modal
        open={showClearModal}
        title="清空对话"
        onClose={() => setShowClearModal(false)}
        footer={
          <>
            <button
              onClick={() => setShowClearModal(false)}
              className="px-4 py-2 rounded-xl text-sm text-white/70 hover:bg-white/10 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-2 rounded-xl text-sm bg-red-500/20 hover:bg-red-500/30 text-red-100 transition-colors"
            >
              清空
            </button>
          </>
        }
      >
        确定要清空和 {activeAgent.name} 的所有聊天记录吗？这个操作无法撤销。
      </Modal>
    </div>
  );
}
