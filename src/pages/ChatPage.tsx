import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send, RotateCcw, Trash2, MoreVertical, Square } from 'lucide-react';
import { useChatStore } from '../store/chat';
import { toast } from '../store/toast';
import { Avatar } from '../components/Avatar';
import { Modal } from '../components/Modal';
import { cn } from '../lib/utils';

export function ChatPage() {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const {
    agent,
    messages,
    loading,
    streaming,
    streamingContent,
    error,
    fetchHistory,
    sendMessage,
    regenerate,
    clearHistory,
    stopStreaming,
    reset,
  } = useChatStore();

  const [input, setInput] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (agentId) {
      fetchHistory(Number(agentId));
    }
    return () => reset();
  }, [agentId, fetchHistory, reset]);

  // 自动滚动到底部
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
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
    sendMessage(input);
    setInput('');
    setTimeout(() => {
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }, 0);
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
    setShowClearConfirm(false);
    await clearHistory();
    toast.success('已清空对话');
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4">
        <p className="text-white/50">好友不存在</p>
        <button onClick={() => navigate('/')} className="px-6 py-3 rounded-xl glass">
          返回
        </button>
      </div>
    );
  }

  const hasMessages = messages.length > 0;

  return (
    <div className="min-h-dvh flex flex-col">
      {/* 顶部栏 */}
      <header className="sticky top-0 z-30 glass px-3 py-3">
        <div className="flex items-center gap-2 max-w-md mx-auto">
          <button
            onClick={() => navigate('/')}
            className="touch-target flex items-center justify-center w-10 h-10 rounded-xl hover:bg-white/10"
          >
            <ArrowLeft size={20} />
          </button>
          <Avatar src={agent.avatar} name={agent.name} size="sm" />
          <div className="flex-1 min-w-0">
            <h1 className="font-medium truncate">{agent.name}</h1>
          </div>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="touch-target flex items-center justify-center w-10 h-10 rounded-xl hover:bg-white/10"
          >
            <MoreVertical size={20} />
          </button>
        </div>

        {/* 下拉菜单 */}
        {showMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            <div className="absolute right-3 top-14 z-50 glass-card p-1 w-40">
              <button
                onClick={() => { setShowMenu(false); regenerate(); }}
                disabled={streaming || !hasMessages}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-white/10 disabled:opacity-40 text-sm"
              >
                <RotateCcw size={16} /> 重新生成
              </button>
              <button
                onClick={() => { setShowMenu(false); setShowClearConfirm(true); }}
                disabled={streaming}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-white/10 disabled:opacity-40 text-sm text-red-300"
              >
                <Trash2 size={16} /> 清空对话
              </button>
            </div>
          </>
        )}
      </header>

      {/* 消息列表 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="max-w-md mx-auto px-4 py-4 space-y-3">
          {/* 开场白 */}
          {!hasMessages && !streaming && agent.greeting && (
            <div className="flex gap-2">
              <Avatar src={agent.avatar} name={agent.name} size="sm" />
              <div className="glass-card px-4 py-3 max-w-[80%]">
                <p className="text-sm">{agent.greeting}</p>
              </div>
            </div>
          )}

          {/* 空状态 */}
          {!hasMessages && !streaming && !agent.greeting && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Avatar src={agent.avatar} name={agent.name} size="xl" />
              <p className="mt-4 text-white/50">和 {agent.name} 说点什么吧</p>
            </div>
          )}

          {/* 消息 */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              {msg.role === 'assistant' && <Avatar src={agent.avatar} name={agent.name} size="sm" />}
              <div
                onClick={() => handleCopy(msg.content)}
                className={cn(
                  'px-4 py-2.5 max-w-[80%] rounded-2xl cursor-pointer transition-colors text-sm whitespace-pre-wrap break-words',
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 rounded-br-md'
                    : 'glass-card rounded-bl-md hover:bg-white/10',
                )}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* 流式输出中 */}
          {streaming && (
            <div className="flex gap-2">
              <Avatar src={agent.avatar} name={agent.name} size="sm" />
              <div className="glass-card px-4 py-2.5 max-w-[80%] rounded-2xl rounded-bl-md">
                {streamingContent ? (
                  <p className="text-sm whitespace-pre-wrap break-words">{streamingContent}</p>
                ) : (
                  <div className="flex items-center gap-1 py-1">
                    <span className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="flex justify-center">
              <div className="glass-card px-4 py-2 border-red-500/30 text-sm text-red-200 flex items-center gap-2">
                <span>{error}</span>
                <button onClick={() => regenerate()} className="underline">重试</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 输入区 */}
      <div className="sticky bottom-0 glass safe-bottom">
        <div className="max-w-md mx-auto px-3 py-2 flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => { setInput(e.target.value); adjustTextarea(); }}
            onKeyDown={handleKeyDown}
            placeholder={`和 ${agent.name} 聊聊...`}
            rows={1}
            className="flex-1 bg-white/5 rounded-xl px-4 py-2.5 outline-none focus:bg-white/10 transition-colors resize-none max-h-[120px] text-sm"
          />
          {streaming ? (
            <button
              onClick={stopStreaming}
              className="touch-target flex items-center justify-center w-10 h-10 rounded-xl bg-red-500/20 text-red-300 flex-shrink-0"
            >
              <Square size={18} />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="touch-target flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 disabled:opacity-30 flex-shrink-0"
            >
              <Send size={18} />
            </button>
          )}
        </div>
      </div>

      {/* 清空确认 */}
      <Modal open={showClearConfirm} onClose={() => setShowClearConfirm(false)} title="清空对话">
        <p className="text-sm text-white/60 mb-4">确定要清空与 {agent.name} 的所有对话记录吗？此操作不可撤销。</p>
        <div className="flex gap-3">
          <button
            onClick={() => setShowClearConfirm(false)}
            className="flex-1 py-3 rounded-xl glass hover:bg-white/10"
          >
            取消
          </button>
          <button
            onClick={handleClear}
            className="flex-1 py-3 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-500/30"
          >
            清空
          </button>
        </div>
      </Modal>
    </div>
  );
}
