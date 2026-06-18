import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAgentsStore } from '../store/agents'
import { uploadApi } from '../lib/api'
import { MODEL_PROVIDERS } from '../types'
import type { AgentFormData } from '../types'
import Avatar from '../components/Avatar'
import { ArrowLeft, Camera, Check, ChevronDown, Thermometer, Hash, Key, Cpu } from 'lucide-react'

const defaultForm: AgentFormData = {
  name: '',
  avatar: null,
  persona: '',
  modelProvider: 'openai',
  apiBaseUrl: 'https://api.openai.com/v1',
  modelName: 'gpt-4o-mini',
  temperature: 0.7,
  maxTokens: 4096,
  apiKey: '',
}

export default function AgentEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { createAgent, updateAgent, agents } = useAgentsStore()
  const isEdit = id !== 'new'
  const [form, setForm] = useState<AgentFormData>(defaultForm)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEdit && id) {
      const agent = agents.find((a) => a.id === Number(id))
      if (agent) {
        setForm({
          name: agent.name,
          avatar: agent.avatar,
          persona: agent.persona,
          modelProvider: agent.modelProvider,
          apiBaseUrl: agent.apiBaseUrl,
          modelName: agent.modelName,
          temperature: agent.temperature,
          maxTokens: agent.maxTokens,
          apiKey: agent.apiKey,
        })
      }
    }
  }, [id, isEdit, agents])

  const update = (field: keyof AgentFormData, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleProviderChange = (providerId: string) => {
    const provider = MODEL_PROVIDERS.find((p) => p.id === providerId)
    setForm((prev) => ({
      ...prev,
      modelProvider: providerId,
      apiBaseUrl: provider?.baseUrl || prev.apiBaseUrl,
      modelName: provider?.models[0] || prev.modelName,
    }))
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const reader = new FileReader()
      reader.onload = async () => {
        const base64 = reader.result as string
        try {
          const { url } = await uploadApi.avatar(base64)
          update('avatar', url)
        } catch {
          // 如果上传失败,直接用 base64
          update('avatar', base64)
        }
        setUploading(false)
      }
      reader.readAsDataURL(file)
    } catch {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      if (isEdit && id) {
        await updateAgent(Number(id), form)
      } else {
        await createAgent(form)
      }
      navigate('/agents')
    } catch {
      setSaving(false)
    }
  }

  const currentProvider = MODEL_PROVIDERS.find((p) => p.id === form.modelProvider)

  return (
    <div className="min-h-screen pb-32 page-enter">
      {/* 顶部导航 */}
      <div className="px-4 pt-14 pb-2 flex items-center gap-3">
        <button
          onClick={() => navigate('/agents')}
          className="p-2 rounded-xl glass text-white/60 hover:text-white/90 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-semibold text-white/90">
          {isEdit ? '编辑智能体' : '创建智能体'}
        </h1>
      </div>

      <div className="px-4 space-y-4">
        {/* 头像预览 */}
        <div className="flex flex-col items-center py-6">
          <div className="relative">
            <div className="absolute inset-0 aurora-gradient rounded-3xl blur-xl opacity-20 animate-breathing" />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="relative w-24 h-24 rounded-3xl overflow-hidden glass-strong flex items-center justify-center group"
            >
              {form.avatar ? (
                <img src={form.avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <Avatar name={form.name || '?'} size={96} />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera size={24} className="text-white" />
              </div>
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden"
          />
          <p className="text-xs text-white/30 mt-3">
            {uploading ? '上传中...' : '点击上传头像'}
          </p>
        </div>

        {/* 名称 */}
        <Field label="名称">
          <input
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="给你的智能体起个名字"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white/90 placeholder-white/30 focus:border-aurora-blue/50 transition-colors"
          />
        </Field>

        {/* 人设 */}
        <Field label="人设 / 系统提示词">
          <textarea
            value={form.persona}
            onChange={(e) => update('persona', e.target.value)}
            placeholder="描述智能体的性格、能力、行为准则..."
            rows={4}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white/90 placeholder-white/30 focus:border-aurora-blue/50 transition-colors resize-none"
          />
        </Field>

        {/* 模型提供商 */}
        <Field label="模型提供商">
          <div className="flex flex-wrap gap-2">
            {MODEL_PROVIDERS.map((provider) => {
              const selected = form.modelProvider === provider.id
              return (
                <button
                  key={provider.id}
                  onClick={() => handleProviderChange(provider.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    selected
                      ? 'aurora-gradient text-white scale-105'
                      : 'glass text-white/50 hover:text-white/70'
                  }`}
                >
                  {provider.name}
                </button>
              )
            })}
          </div>
        </Field>

        {/* 模型选择 */}
        {currentProvider && currentProvider.models.length > 0 && (
          <Field label="模型">
            <div className="relative">
              <button
                onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                className="w-full glass border border-white/10 rounded-2xl px-4 py-3 flex items-center justify-between text-white/90"
              >
                <span className="flex items-center gap-2">
                  <Cpu size={16} className="text-white/40" />
                  {form.modelName}
                </span>
                <ChevronDown
                  size={16}
                  className={`text-white/40 transition-transform ${modelDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {modelDropdownOpen && (
                <div className="absolute top-full mt-2 w-full glass-strong rounded-2xl overflow-hidden z-20 animate-scale-in">
                  {currentProvider.models.map((model) => (
                    <button
                      key={model}
                      onClick={() => {
                        update('modelName', model)
                        setModelDropdownOpen(false)
                      }}
                      className={`w-full px-4 py-3 text-left text-sm hover:bg-white/5 transition-colors ${
                        form.modelName === model ? 'text-aurora-cyan' : 'text-white/70'
                      }`}
                    >
                      {model}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Field>
        )}

        {/* 自定义模型名 */}
        {form.modelProvider === 'custom' && (
          <Field label="模型名称">
            <input
              value={form.modelName}
              onChange={(e) => update('modelName', e.target.value)}
              placeholder="如 gpt-4o-mini"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white/90 placeholder-white/30 focus:border-aurora-blue/50 transition-colors"
            />
          </Field>
        )}

        {/* API Base URL */}
        <Field label="API Base URL">
          <input
            value={form.apiBaseUrl}
            onChange={(e) => update('apiBaseUrl', e.target.value)}
            placeholder="https://api.openai.com/v1"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white/90 placeholder-white/30 focus:border-aurora-blue/50 transition-colors text-sm"
          />
        </Field>

        {/* 温度 */}
        <Field label="温度" icon={<Thermometer size={14} />}>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={form.temperature}
              onChange={(e) => update('temperature', Number(e.target.value))}
              className="flex-1 accent-aurora-blue"
            />
            <span className="text-sm text-white/60 w-10 text-right font-mono">
              {form.temperature.toFixed(1)}
            </span>
          </div>
        </Field>

        {/* 最大 Token */}
        <Field label="最大 Token" icon={<Hash size={14} />}>
          <input
            type="number"
            value={form.maxTokens}
            onChange={(e) => update('maxTokens', Number(e.target.value))}
            min="1"
            max="128000"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white/90 focus:border-aurora-blue/50 transition-colors"
          />
        </Field>

        {/* API Key */}
        <Field label="API Key" icon={<Key size={14} />}>
          <input
            type="password"
            value={form.apiKey}
            onChange={(e) => update('apiKey', e.target.value)}
            placeholder="sk-..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white/90 placeholder-white/30 focus:border-aurora-blue/50 transition-colors"
          />
        </Field>
      </div>

      {/* 底部保存按钮 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] p-4 safe-bottom z-50">
        <button
          onClick={handleSave}
          disabled={!form.name.trim() || saving}
          className="w-full aurora-gradient text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
        >
          {saving ? (
            <span className="animate-pulse-soft">保存中...</span>
          ) : (
            <>
              <Check size={20} />
              {isEdit ? '保存修改' : '创建智能体'}
            </>
          )}
        </button>
      </div>
    </div>
  )
}

function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="animate-fade-in-up">
      <label className="flex items-center gap-1.5 text-xs font-medium text-white/40 mb-2 px-1">
        {icon}
        {label}
      </label>
      {children}
    </div>
  )
}
