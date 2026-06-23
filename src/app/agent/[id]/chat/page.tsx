'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Send,
  RotateCcw,
  Trash2,
  MoreVertical,
  Copy,
  Sparkles,
} from 'lucide-react';
import { useChatStore } from '@/store/chat';
import { useAuthStore } from '@/store/auth';
import { toast } from '@/store/toast';
import { Avatar } from '@/components/Avatar';
import { GlassCard } from '@/components/GlassCard';
import { Modal } from '@/components/Modal';
import { EmptyState } from '@/components/EmptyState';
import { cn } from '@/lib/utils';

export default function ChatPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const agentId = params.id;

  const user = useAuthStore((s) => s.user);
  const {
    agent,
    messages,
    streaming,
    streamingContent,
    loading,
    error,
    fetchHistory,
    sendMessage,
    regenerate,
    clearHistory,
    reset,
  } = useChatStore();

  const [input, setInput] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (agentId && user) {
      fetchHistory(agentId).catch(() => {});
    }
    return () => reset();
  }, [agentId, user, fetchHistory, reset]);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  // 自适应输入框高度
  const adjustTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  const handleSend = () => {
    if (!input.trim() || streaming) return;
    const content = input.trim();
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    sendMessage(content).catch((err) => {
      toast.error(err.message || '发送失败');
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      toast.success('已复制');
    });
  };

  const handleClear = async () => {
    try {
      await clearHistory();
      toast.success('已清空对话');
      setShowClearConfirm(false);
      setShowMenu(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '清空失败');
    }
  };

  const handleRegenerate = () => {
    setShowMenu(false);
    regenerate().catch((err) => {
      toast.error(err.message || '重新生成失败');
    });
  };

  const displayMessages = messages.filter((m) => m.role === 'user' || m.role === 'assistant');
  const hasMessages = displayMessages.length > 0;
  const lastMessage = displayMessages[displayMessages.length - 1];
  const canRegenerate =
    !streaming && hasMessages && lastMessage?.role === 'assistant';

  return (
    <main className="flex flex-col h-dvh">
      {/* 顶部栏 */}
      <header className="flex-shrink-0 backdrop-blur-xl bg-background/80 border-b border-border safe-area-top z-20">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          {agent && (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar src={agent.avatar} name={agent.name} size="md" />
              <div className="min-w-0">
                <h1 className="font-semibold text-foreground truncate">
                  {agent.name}
                </h1>
                {streaming && (
                  <p className="text-xs text-primary flex items-center gap-1">
                    <Sparkles size={12} className="animate-pulse" />
                    正在输入...
                  </p>
                )}
              </div>
            </div>
          )}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 -mr-2 rounded-xl hover:bg-muted transition-colors"
            >
              <MoreVertical size={20} />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
                <GlassCard className="absolute right-0 top-full mt-2 w-40 py-2 z-40 overflow-hidden">
                  <button
                    onClick={handleRegenerate}
                    disabled={!canRegenerate}
                    className={cn(
                      'w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-muted/50 transition-colors',
                      !canRegenerate && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <RotateCcw size={16} />
                    重新生成
                  </button>
                  <button
                    onClick={() => {
                      setShowClearConfirm(true);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-destructive flex items-center gap-2 hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 size={16} />
                    清空对话
                  </button>
                </GlassCard>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 消息区域 */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-w-md mx-auto w-full"
      >
        {loading && messages.length === 0 ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : !hasMessages ? (
          <EmptyState
            icon={<Sparkles size={40} />}
            title={agent ? `和 ${agent.name} 打个招呼吧` : '开始聊天'}
            description={agent?.greeting || '发送第一条消息，开始你们的对话'}
            className="py-12"
          />
        ) : (
          <>
            {displayMessages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              const isLast = idx === displayMessages.length - 1;
              const isStreamingLast = isLast && !isUser && streaming;

              return (
                <div
                  key={msg.id}
                  className={cn(
                    'flex gap-3 animate-fade-in',
                    isUser ? 'flex-row-reverse' : 'flex-row'
                  )}
                >
                  <Avatar
                    src={isUser ? user?.avatar || null : agent?.avatar || null}
                    name={isUser ? user?.nickname || '我' : agent?.name || 'AI'}
                    size="sm"
                    className="flex-shrink-0 mt-0.5"
                  />
                  <div
                    className={cn(
                      'max-w-[75%] group relative',
                      isUser ? 'items-end' : 'items-start'
                    )}
                  >
                    <div
                      className={cn(
                        'px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words',
                        isUser
                          ? 'bg-gradient-to-br from-primary to-secondary text-white rounded-br-md'
                          : 'bg-card text-card-foreground border border-border rounded-bl-md'
                      )}
                    >
                      {isStreamingLast ? streamingContent || '...' : msg.content}
                    </div>
                    {!isStreamingLast && (
                      <button
                        onClick={() => handleCopy(msg.content)}
                        className={cn(
                          'absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-background border border-border text-muted-foreground hover:text-foreground',
                          isUser ? '-left-8' : '-right-8'
                        )}
                      >
                        <Copy size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {error && (
              <div className="text-center text-sm text-destructive py-2">{error}</div>
            )}
          </>
        )}
      </div>

      {/* 输入区域 */}
      <div className="flex-shrink-0 border-t border-border bg-background/80 backdrop-blur-xl safe-area-bottom">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  adjustTextarea();
                }}
                onKeyDown={handleKeyDown}
                placeholder="说点什么..."
                rows={1}
                className="w-full px-4 py-2.5 pr-12 rounded-2xl bg-muted border border-transparent focus:border-primary focus:outline-none transition-colors text-foreground resize-none max-h-[120px]"
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || streaming}
              className={cn(
                'p-3 rounded-2xl flex-shrink-0 transition-all',
                input.trim() && !streaming
                  ? 'bg-gradient-to-br from-primary to-secondary text-white shadow-lg shadow-primary/20 active:scale-95'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              )}
            >
              <Send size={20} />
            </button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Enter 发送 / Shift+Enter 换行
          </p>
        </div>
      </div>

      <Modal
        open={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title="清空对话"
      >
        <p className="text-sm text-muted-foreground mb-6">
          确定要清空和 {agent?.name} 的所有对话记录吗？此操作不可恢复。
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setShowClearConfirm(false)}
            className="flex-1 py-2.5 rounded-xl border border-border text-foreground font-medium hover:bg-muted transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleClear}
            className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground font-medium hover:opacity-90 transition-opacity"
          >
            清空
          </button>
        </div>
      </Modal>
    </main>
  );
}
