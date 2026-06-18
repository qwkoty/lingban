import { useEffect, useState, useRef } from 'react'
import { useAgentsStore } from '../store/agents'
import { useChatStore } from '../store/chat'
import Avatar from '../components/Avatar'
import GlassCard from '../components/GlassCard'
import EmptyState from '../components/EmptyState'
import { Send, ArrowLeft, Bot, MessageSquare } from 'lucide-react'
import type { Agent } from '../types'

export default function ChatPage() {
  const { agents, fetchAgents } = useAgentsStore()
  const { messages, loading, streaming, fetchMessages, sendMessage, clearMessages } = useChatStore()
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSelectAgent = async (agent: Agent) => {
    setSelectedAgent(agent)
    await fetchMessages(agent.id)
  }

  const handleBack = () => {
    setSelectedAgent(null)
    clearMessages()
  }

  const handleSend = async () => {
    if (!input.trim() || !selectedAgent || streaming) return
    const msg = input.trim()
    setInput('')
    await sendMessage(selectedAgent.id, msg)
  }

  // 聊天界面
  if (selectedAgent) {
    return (
      <div className="h-screen flex flex-col page-enter">
        {/* 顶部导航 */}
        <div className="flex items-center gap-3 px-4 pt-14 pb-3 border-b border-white/5">
          <button
            onClick={handleBack}
            className="p-2 rounded-xl glass text-white/60 hover:text-white/90 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <Avatar src={selectedAgent.avatar} name={selectedAgent.name} size={36} />
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-white/90 truncate">{selectedAgent.name}</h2>
            <p className="text-xs text-white/30">{selectedAgent.modelName}</p>
          </div>
        </div>

        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                  <div className="skeleton h-12 w-48 rounded-2xl" />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mb-4 animate-breathing">
                <Bot size={28} className="text-white/30" />
              </div>
              <p className="text-sm text-white/30">开始与 {selectedAgent.name} 对话</p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
                style={{ animationDelay: `${Math.min(i * 30, 300)}ms`, opacity: 0 }}
              >
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-aurora-blue/20 border border-aurora-blue/20 text-white/90 rounded-br-md'
                      : 'glass text-white/80 rounded-bl-md'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
              </div>
            ))
          )}

          {/* 流式加载指示器 */}
          {streaming && messages.length > 0 && messages[messages.length - 1].role === 'assistant' && messages[messages.length - 1].content === '' && (
            <div className="flex justify-start animate-fade-in">
              <div className="glass px-4 py-3 rounded-2xl rounded-bl-md flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-white/40 animate-pulse-soft" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-white/40 animate-pulse-soft" style={{ animationDelay: '200ms' }} />
                <span className="w-2 h-2 rounded-full bg-white/40 animate-pulse-soft" style={{ animationDelay: '400ms' }} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 输入栏 */}
        <div className="px-4 pb-24 pt-2 safe-bottom">
          <div className="glass-strong rounded-2xl flex items-end gap-2 p-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="输入消息..."
              rows={1}
              className="flex-1 bg-transparent px-3 py-2 text-white/90 placeholder-white/30 resize-none max-h-32 no-scrollbar"
              style={{ minHeight: '40px' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || streaming}
              className="w-10 h-10 rounded-xl aurora-gradient flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 transition-transform"
            >
              <Send size={18} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 智能体选择界面
  return (
    <div className="min-h-screen pb-28 page-enter">
      <div className="px-6 pt-14 pb-4">
        <h1 className="text-2xl font-bold font-display text-white/90">对话</h1>
        <p className="text-sm text-white/40 mt-1">选择一个智能体开始对话</p>
      </div>

      <div className="px-4 space-y-3">
        {agents.length === 0 ? (
          <EmptyState
            icon={<MessageSquare size={28} className="text-white/30" />}
            title="还没有智能体"
            description="先去创建一个智能体吧"
          />
        ) : (
          agents.map((agent, i) => (
            <GlassCard
              key={agent.id}
              onClick={() => handleSelectAgent(agent)}
              className="p-4 flex items-center gap-4"
            >
              <div
                className="animate-fade-in-up"
                style={{ animationDelay: `${i * 60}ms`, opacity: 0 }}
              >
                <Avatar src={agent.avatar} name={agent.name} size={48} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white/90 truncate">{agent.name}</h3>
                <p className="text-xs text-white/30 mt-0.5 truncate">
                  {agent.persona || '暂无人设'}
                </p>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  )
}
