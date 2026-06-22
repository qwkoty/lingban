import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Camera, Wand2 } from 'lucide-react';
import { useAgentsStore } from '../store/agents';
import { useToastStore } from '../store/toast';
import { uploadApi } from '../lib/api';
import { Avatar } from '../components/Avatar';
import { cn } from '../lib/utils';
import type { Agent } from '../types';

const providers = [
  { value: 'deepseek-pro', label: 'DeepSeek V4 Pro', modelProvider: 'deepseek' as const, modelName: 'deepseek-v4-pro' },
  { value: 'deepseek-flash', label: 'DeepSeek V4 Flash', modelProvider: 'deepseek' as const, modelName: 'deepseek-v4-flash' },
  { value: 'custom', label: '自定义', modelProvider: 'custom' as const, modelName: '' },
];

function getProviderValue(modelProvider: string, modelName: string) {
  if (modelProvider === 'custom') return 'custom';
  if (modelName === 'deepseek-v4-flash') return 'deepseek-flash';
  return 'deepseek-pro';
}

const templates = [
  {
    label: '知心好友',
    name: '小知',
    persona: '你是用户的知心好友，善于倾听，说话温柔、真诚。会在用户失落时安慰，开心时一起笑。你懂得保持距离，也会适时调侃。',
    greeting: '嗨，最近怎么样？想聊点什么都可以跟我说～',
    modelProvider: 'deepseek' as const,
    modelName: 'deepseek-v4-pro',
    temperature: 0.8,
  },
  {
    label: '游戏搭子',
    name: '阿游',
    persona: '你是个游戏宅好友，对各种游戏了如指掌。说话直接、爱吐槽，但技术过硬。会推荐游戏、分析战绩，也接受用户炫耀。',
    greeting: '上线了吗？今天准备冲分还是娱乐？',
    modelProvider: 'deepseek' as const,
    modelName: 'deepseek-v4-pro',
    temperature: 0.9,
  },
  {
    label: '学习伙伴',
    name: '小助',
    persona: '你是用户的学习伙伴，耐心、有条理。会帮助拆解问题、鼓励用户，但不会直接给答案，而是引导用户思考。',
    greeting: '今天想学什么？我陪你一起攻克它。',
    modelProvider: 'deepseek' as const,
    modelName: 'deepseek-v4-pro',
    temperature: 0.6,
  },
  {
    label: '幽默损友',
    name: '阿损',
    persona: '你是用户的损友，说话幽默毒舌但心地善良。喜欢开玩笑、斗嘴，但关键时刻会认真。经常用网络流行语。',
    greeting: '哟，来了？今天又有什么好戏？',
    modelProvider: 'deepseek' as const,
    modelName: 'deepseek-v4-pro',
    temperature: 1.0,
  },
  {
    label: '温柔倾听者',
    name: '静静',
    persona: '你是一位温柔安静的倾听者。不急着给建议，更多陪伴和共情。说话简短、治愈，让用户感到被接纳。',
    greeting: '嗯，我在这儿。你想说什么，我都听着。',
    modelProvider: 'deepseek' as const,
    modelName: 'deepseek-v4-pro',
    temperature: 0.7,
  },
];

type AgentForm = Omit<Agent, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

function getInitialForm(agent?: Agent | null): AgentForm {
  return {
    name: agent?.name ?? '',
    avatar: agent?.avatar ?? '',
    persona: agent?.persona ?? '',
    greeting: agent?.greeting ?? '',
    modelProvider: agent?.modelProvider ?? 'deepseek',
    modelName: agent?.modelName ?? 'deepseek-v4-pro',
    apiEndpoint: agent?.apiEndpoint ?? '',
    temperature: agent?.temperature ?? 0.7,
    maxTokens: agent?.maxTokens ?? 4096,
    apiKey: agent?.apiKey ?? '',
  };
}

export function AgentEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const agentId = id ? Number(id) : null;
  const isEdit = Boolean(agentId);

  const { agents, createAgent, updateAgent, fetchAgents } = useAgentsStore();
  const showToast = useToastStore((s) => s.show);
  const existing = agents.find((a) => a.id === agentId);

  const [form, setForm] = useState(getInitialForm(existing));
  const [saving, setSaving] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (agents.length === 0) fetchAgents();
  }, [agents.length, fetchAgents]);

  useEffect(() => {
    if (existing) setForm(getInitialForm(existing));
  }, [existing]);

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { url } = await uploadApi.avatar(file);
      update('avatar', url);
      showToast('头像上传成功', 'success');
    } catch (err) {
      showToast((err as Error).message, 'error');
    }
  };

  const applyTemplate = (tpl: (typeof templates)[0]) => {
    setForm((prev) => ({
      ...prev,
      name: prev.name || tpl.name,
      persona: tpl.persona,
      greeting: tpl.greeting,
      modelProvider: tpl.modelProvider,
      modelName: tpl.modelName,
      temperature: tpl.temperature,
    }));
    setShowTemplates(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast('请填写好友名称', 'error');
      return;
    }

    setSaving(true);
    try {
      if (isEdit && agentId) {
        await updateAgent(agentId, form);
        showToast('已保存', 'success');
      } else {
        const agent = await createAgent(form);
        showToast('创建成功', 'success');
        navigate(`/?agent=${agent.id}`);
        return;
      }
      navigate('/agents');
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-full p-4 pb-28">
      <header className="flex items-center gap-3 mb-6 max-w-2xl mx-auto">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-white">{isEdit ? '编辑 AI 好友' : '新建 AI 好友'}</h1>
      </header>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-5">
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={handleAvatarClick}
            className="relative group"
          >
            <Avatar src={form.avatar} name={form.name || '?'} size="xl" />
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div className="glass rounded-2xl border border-white/10 p-4 space-y-4">
          <div>
            <label className="block text-sm text-white/70 mb-1">名称 *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="给 TA 取个名字"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:border-white/30 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-1">开场白</label>
            <textarea
              value={form.greeting}
              onChange={(e) => update('greeting', e.target.value)}
              placeholder="用户进入聊天时，TA 会主动说的第一句话"
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:border-white/30 transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-1">角色设定</label>
            <textarea
              value={form.persona}
              onChange={(e) => update('persona', e.target.value)}
              placeholder="性格、背景、说话方式、和用户的关係等"
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:border-white/30 transition-colors resize-none"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowTemplates(true)}
            className="flex items-center gap-2 text-sm text-blue-300 hover:text-blue-200 transition-colors"
          >
            <Wand2 className="w-4 h-4" /> 从模板开始
          </button>
        </div>

        <div className="glass rounded-2xl border border-white/10 p-4 space-y-4">
          <h2 className="text-sm font-semibold text-white/90">模型配置</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/70 mb-1">提供商</label>
              <select
                value={getProviderValue(form.modelProvider, form.modelName)}
                onChange={(e) => {
                  const selected = providers.find((p) => p.value === e.target.value)!;
                  update('modelProvider', selected.modelProvider);
                  update('modelName', selected.modelName);
                }}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-white/30 transition-colors"
              >
                {providers.map((p) => (
                  <option key={p.value} value={p.value} className="bg-gray-900">
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">模型名</label>
              <input
                type="text"
                value={form.modelName}
                onChange={(e) => update('modelName', e.target.value)}
                placeholder="deepseek-v4-pro"
                readOnly={form.modelProvider !== 'custom'}
                className={`w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 transition-colors ${
                  form.modelProvider === 'custom' ? 'focus:border-white/30' : 'opacity-60 cursor-not-allowed'
                }`}
              />
            </div>
          </div>

          {form.modelProvider === 'custom' && (
            <div>
              <label className="block text-sm text-white/70 mb-1">自定义端点</label>
              <input
                type="text"
                value={form.apiEndpoint}
                onChange={(e) => update('apiEndpoint', e.target.value)}
                placeholder="https://.../v1/chat/completions"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:border-white/30 transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-white/70 mb-1">API Key</label>
            <input
              type="password"
              value={form.apiKey}
              onChange={(e) => update('apiKey', e.target.value)}
              placeholder="sk-..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:border-white/30 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/70 mb-1">
                温度: {form.temperature}
              </label>
              <input
                type="range"
                min={0}
                max={2}
                step={0.1}
                value={form.temperature}
                onChange={(e) => update('temperature', Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Max Tokens</label>
              <input
                type="number"
                min={1}
                max={8192}
                value={form.maxTokens}
                onChange={(e) => update('maxTokens', Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-white/30 transition-colors"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className={cn(
            'w-full py-3 rounded-2xl font-medium text-white transition-all active:scale-[0.98]',
            saving ? 'bg-white/20 cursor-not-allowed' : 'bg-white/15 hover:bg-white/25'
          )}
        >
          {saving ? '保存中…' : isEdit ? '保存' : '创建并聊天'}
        </button>
      </form>

      {showTemplates && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in-up"
          onClick={() => setShowTemplates(false)}
        >
          <div
            className="w-full max-w-md glass rounded-3xl border border-white/10 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-white mb-4">选择 AI 好友模板</h2>
            <div className="grid gap-2 max-h-[60vh] overflow-y-auto scrollbar-thin">
              {templates.map((tpl) => (
                <button
                  key={tpl.label}
                  type="button"
                  onClick={() => applyTemplate(tpl)}
                  className="text-left p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                >
                  <div className="font-medium text-white mb-1">{tpl.label}</div>
                  <div className="text-xs text-white/50 line-clamp-2">{tpl.persona}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
