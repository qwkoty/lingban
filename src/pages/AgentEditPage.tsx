import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Trash2, Sparkles } from 'lucide-react';
import { useAgentsStore } from '../store/agents';
import { toast } from '../store/toast';
import { Avatar } from '../components/Avatar';
import { GlassCard } from '../components/GlassCard';
import { Modal } from '../components/Modal';
import { api } from '../lib/api';
import { AGENT_TEMPLATES, type ModelProvider } from '../types';
import { cn } from '../lib/utils';

const PROVIDERS: { value: ModelProvider; label: string }[] = [
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic (需自定义端点)' },
  { value: 'custom', label: '自定义' },
];

export function AgentEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { createAgent, updateAgent, deleteAgent, fetchAgents } = useAgentsStore();
  const isEdit = Boolean(id);

  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [persona, setPersona] = useState('');
  const [greeting, setGreeting] = useState('');
  const [modelProvider, setModelProvider] = useState<ModelProvider>('deepseek');
  const [modelName, setModelName] = useState('deepseek-chat');
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(4096);
  const [saving, setSaving] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (isEdit && id) {
      api.getAgent(Number(id)).then(({ agent }) => {
        setName(agent.name);
        setAvatar(agent.avatar);
        setPersona(agent.persona);
        setGreeting(agent.greeting);
        setModelProvider(agent.modelProvider as ModelProvider);
        setModelName(agent.modelName);
        setApiEndpoint(agent.apiEndpoint);
        setApiKey(agent.apiKey);
        setTemperature(agent.temperature);
        setMaxTokens(agent.maxTokens);
      }).catch(() => {
        toast.error('智能体不存在');
        navigate('/');
      });
    }
  }, [id, isEdit, navigate]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { url } = await api.uploadAvatar(file);
      setAvatar(url);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const applyTemplate = (tpl: typeof AGENT_TEMPLATES[number]) => {
    setName(tpl.name);
    setPersona(tpl.persona);
    setGreeting(tpl.greeting);
    setModelProvider(tpl.modelProvider);
    setModelName(tpl.modelName);
    setShowTemplates(false);
    toast.success(`已应用「${tpl.name}」模板`);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('请填写名称');
      return;
    }
    if (!apiKey.trim()) {
      toast.error('请填写 API Key');
      return;
    }
    if ((modelProvider === 'custom' || modelProvider === 'anthropic') && !apiEndpoint.trim()) {
      toast.error('请填写 API 端点');
      return;
    }

    setSaving(true);
    try {
      const data = {
        name: name.trim(),
        avatar,
        persona,
        greeting,
        modelProvider,
        modelName: modelName.trim(),
        apiEndpoint: apiEndpoint.trim(),
        apiKey: apiKey.trim(),
        temperature,
        maxTokens,
      };
      if (isEdit && id) {
        await updateAgent(Number(id), data);
        toast.success('保存成功');
      } else {
        await createAgent(data);
        toast.success('创建成功');
      }
      await fetchAgents();
      navigate('/');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteAgent(Number(id));
      toast.success('已删除');
      navigate('/');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="min-h-dvh pb-24">
      <header className="sticky top-0 z-30 glass px-5 py-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="touch-target flex items-center justify-center w-10 h-10 rounded-xl hover:bg-white/10"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-semibold">{isEdit ? '编辑好友' : '创建好友'}</h1>
          <button
            onClick={handleSave}
            disabled={saving}
            className="touch-target flex items-center justify-center w-10 h-10 rounded-xl hover:bg-white/10 disabled:opacity-40"
          >
            <Check size={20} />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-4">
        {/* 头像与名称 */}
        <GlassCard className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="cursor-pointer">
              <Avatar src={avatar} name={name || '新好友'} size="xl" />
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </label>
            <div className="flex-1">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="给好友起个名字"
                className="w-full bg-white/5 rounded-xl px-4 py-3 outline-none focus:bg-white/10 transition-colors text-lg"
              />
            </div>
          </div>

          {!isEdit && (
            <button
              onClick={() => setShowTemplates(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-600/20 border border-white/10 text-sm hover:bg-white/5 transition-colors"
            >
              <Sparkles size={16} />
              选择预设模板
            </button>
          )}
        </GlassCard>

        {/* 性格人设 */}
        <GlassCard className="space-y-4">
          <div>
            <label className="text-sm text-white/50 mb-1.5 block">性格与人设</label>
            <textarea
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              placeholder="描述这个好友的性格、背景、说话方式..."
              rows={4}
              className="w-full bg-white/5 rounded-xl px-4 py-3 outline-none focus:bg-white/10 transition-colors resize-none"
            />
          </div>
          <div>
            <label className="text-sm text-white/50 mb-1.5 block">开场白</label>
            <textarea
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              placeholder="好友第一次见面时说的话..."
              rows={2}
              className="w-full bg-white/5 rounded-xl px-4 py-3 outline-none focus:bg-white/10 transition-colors resize-none"
            />
          </div>
        </GlassCard>

        {/* 模型配置 */}
        <GlassCard className="space-y-4">
          <div>
            <label className="text-sm text-white/50 mb-1.5 block">模型提供商</label>
            <select
              value={modelProvider}
              onChange={(e) => setModelProvider(e.target.value as ModelProvider)}
              className="w-full bg-white/5 rounded-xl px-4 py-3 outline-none focus:bg-white/10 transition-colors"
            >
              {PROVIDERS.map((p) => (
                <option key={p.value} value={p.value} className="bg-[#1a1a2e]">
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-white/50 mb-1.5 block">模型名称</label>
            <input
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="如 deepseek-chat, gpt-4o..."
              className="w-full bg-white/5 rounded-xl px-4 py-3 outline-none focus:bg-white/10 transition-colors"
            />
          </div>
          <div>
            <label className="text-sm text-white/50 mb-1.5 block">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full bg-white/5 rounded-xl px-4 py-3 outline-none focus:bg-white/10 transition-colors"
            />
          </div>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-white/50 hover:text-white/80 transition-colors"
          >
            {showAdvanced ? '收起高级设置' : '展开高级设置'}
          </button>

          {showAdvanced && (
            <>
              {(modelProvider === 'custom' || modelProvider === 'anthropic') && (
                <div>
                  <label className="text-sm text-white/50 mb-1.5 block">API 端点</label>
                  <input
                    value={apiEndpoint}
                    onChange={(e) => setApiEndpoint(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-white/5 rounded-xl px-4 py-3 outline-none focus:bg-white/10 transition-colors"
                  />
                </div>
              )}
              <div>
                <label className="text-sm text-white/50 mb-1.5 block">
                  温度: {temperature.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm text-white/50 mb-1.5 block">最大 Tokens</label>
                <input
                  type="number"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(Number(e.target.value))}
                  min="100"
                  max="32000"
                  className="w-full bg-white/5 rounded-xl px-4 py-3 outline-none focus:bg-white/10 transition-colors"
                />
              </div>
            </>
          )}
        </GlassCard>

        {isEdit && (
          <button
            onClick={handleDelete}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-500/30 text-red-300 hover:bg-red-500/10 transition-colors touch-target"
          >
            <Trash2 size={18} />
            删除好友
          </button>
        )}
      </main>

      {/* 模板选择弹窗 */}
      <Modal open={showTemplates} onClose={() => setShowTemplates(false)} title="选择预设模板">
        <div className="space-y-2">
          {AGENT_TEMPLATES.map((tpl) => (
            <button
              key={tpl.name}
              onClick={() => applyTemplate(tpl)}
              className={cn(
                'w-full text-left p-4 rounded-xl glass hover:bg-white/10 transition-colors',
              )}
            >
              <div className="font-medium">{tpl.name}</div>
              <p className="text-sm text-white/40 mt-1 line-clamp-2">{tpl.greeting}</p>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
