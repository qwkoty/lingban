import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload } from 'lucide-react';
import { useAgentsStore } from '../store/agents.js';
import { uploadApi, agentsApi } from '../lib/api.js';
import { Avatar } from '../components/Avatar.js';
import { GlassCard } from '../components/GlassCard.js';
import type { Agent } from '../types.js';

const providers = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'custom', label: '自定义' },
];

const defaultAgent: Partial<Agent> = {
  name: '',
  persona: '',
  modelProvider: 'deepseek',
  modelName: 'deepseek-chat',
  temperature: 0.7,
  maxTokens: 4096,
  apiKey: '',
};

export function AgentEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { createAgent, updateAgent } = useAgentsStore();
  const [form, setForm] = useState<Partial<Agent>>(defaultAgent);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const isEdit = id && id !== 'new';

  useEffect(() => {
    if (isEdit) {
      agentsApi.get(Number(id)).then(({ agent }) => setForm(agent));
    }
  }, [id, isEdit]);

  const handleChange = (
    key: keyof Agent,
    value: string | number
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { url } = await uploadApi.avatar(file);
    setForm((prev) => ({ ...prev, avatar: url }));
  };

  const handleSubmit = async () => {
    if (!form.name?.trim()) return;
    setLoading(true);
    try {
      if (isEdit) {
        await updateAgent(Number(id), form);
      } else {
        await createAgent(form);
      }
      navigate('/agents');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 pb-28 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/agents')}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold gradient-text">
          {isEdit ? '编辑智能体' : '创建智能体'}
        </h1>
      </div>

      <div className="space-y-4">
        <GlassCard className="flex flex-col items-center py-6">
          <button
            onClick={() => fileRef.current?.click()}
            className="relative group"
          >
            <Avatar
              src={form.avatar}
              name={form.name || 'AI'}
              size="xl"
            />
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Upload size={24} />
            </div>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatar}
          />
          <p className="text-white/40 text-sm mt-3">点击上传头像</p>
        </GlassCard>

        <GlassCard className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-1">名称</label>
            <input
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="给你的智能体起个名字"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/30 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1">人设 / 系统提示词</label>
            <textarea
              value={form.persona}
              onChange={(e) => handleChange('persona', e.target.value)}
              placeholder="描述这个智能体的角色、语气和能力..."
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/30 transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-2">模型提供商</label>
            <div className="flex flex-wrap gap-2">
              {providers.map((p) => (
                <button
                  key={p.value}
                  onClick={() => handleChange('modelProvider', p.value)}
                  className={`px-4 py-2 rounded-full text-sm border transition-all ${
                    form.modelProvider === p.value
                      ? 'border-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white'
                      : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1">模型名称</label>
            <input
              value={form.modelName}
              onChange={(e) => handleChange('modelName', e.target.value)}
              placeholder="例如 deepseek-chat / gpt-4o-mini"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/30 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1">温度</label>
              <input
                type="number"
                min={0}
                max={2}
                step={0.1}
                value={form.temperature}
                onChange={(e) => handleChange('temperature', Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/30 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">最大 Token</label>
              <input
                type="number"
                min={1}
                max={128000}
                step={1}
                value={form.maxTokens}
                onChange={(e) => handleChange('maxTokens', Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/30 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1">API Key</label>
            <input
              type="password"
              value={form.apiKey}
              onChange={(e) => handleChange('apiKey', e.target.value)}
              placeholder="输入你的 LLM API Key"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/30 transition-colors"
            />
          </div>
        </GlassCard>

        <button
          onClick={handleSubmit}
          disabled={loading || !form.name?.trim()}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 font-medium shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '保存中...' : isEdit ? '保存修改' : '创建智能体'}
        </button>
      </div>
    </div>
  );
}
