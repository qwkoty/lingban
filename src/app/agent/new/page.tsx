'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Sparkles } from 'lucide-react';
import { useAgentsStore } from '@/store/agents';
import { useAuthStore } from '@/store/auth';
import { toast } from '@/store/toast';
import { agentTemplates } from '@/lib/templates';
import { GlassCard } from '@/components/GlassCard';
import { Modal } from '@/components/Modal';
import type { AgentTemplate, ModelProvider } from '@/types';
import { cn } from '@/lib/utils';

const modelProviders: { value: ModelProvider; label: string; defaultModel: string }[] = [
  { value: 'deepseek', label: 'DeepSeek', defaultModel: 'deepseek-chat' },
  { value: 'openai', label: 'OpenAI', defaultModel: 'gpt-4o-mini' },
  { value: 'anthropic', label: 'Anthropic (Claude)', defaultModel: 'claude-3-haiku-20240307' },
  { value: 'custom', label: '自定义端点', defaultModel: '' },
];

export default function AgentEditPage() {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const isEdit = !!params?.id;
  const { createAgent, updateAgent, getAgent, loading } = useAgentsStore();
  const user = useAuthStore((state) => state.user);

  const [showTemplates, setShowTemplates] = useState(false);
  const [form, setForm] = useState({
    name: '',
    persona: '',
    greeting: '',
    modelProvider: 'deepseek' as ModelProvider,
    modelName: 'deepseek-chat',
    apiEndpoint: '',
    temperature: 0.7,
    maxTokens: 4096,
    apiKey: '',
  });

  useEffect(() => {
    if (isEdit && user) {
      const agent = getAgent(params.id!);
      if (agent) {
        setForm({
          name: agent.name,
          persona: agent.persona,
          greeting: agent.greeting,
          modelProvider: agent.modelProvider as ModelProvider,
          modelName: agent.modelName,
          apiEndpoint: agent.apiEndpoint,
          temperature: agent.temperature,
          maxTokens: agent.maxTokens,
          apiKey: agent.apiKey,
        });
      }
    }
  }, [isEdit, params.id, user, getAgent]);

  const handleTemplateSelect = (template: AgentTemplate) => {
    setForm((prev) => ({
      ...prev,
      name: template.name,
      persona: template.persona,
      greeting: template.greeting,
      modelProvider: template.modelProvider,
      modelName: template.modelName,
      temperature: template.temperature,
      maxTokens: template.maxTokens,
    }));
    setShowTemplates(false);
    toast.success(`已应用「${template.name}」模板`);
  };

  const handleProviderChange = (provider: ModelProvider) => {
    const providerConfig = modelProviders.find((p) => p.value === provider);
    setForm((prev) => ({
      ...prev,
      modelProvider: provider,
      modelName: providerConfig?.defaultModel || prev.modelName,
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('请输入智能体名称');
      return;
    }

    try {
      if (isEdit) {
        await updateAgent(params.id!, form);
        toast.success('已保存');
      } else {
        const agent = await createAgent(form);
        toast.success('创建成功');
        router.replace(`/agent/${agent.id}/chat`);
        return;
      }
      router.back();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSave();
  };

  return (
    <main className="min-h-dvh pb-24">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/70 border-b border-border safe-area-top">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-semibold flex-1">
            {isEdit ? '编辑好友' : '新建好友'}
          </h1>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-medium text-sm shadow-lg shadow-primary/20 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={16} />
            保存
          </button>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="max-w-md mx-auto px-4 py-4 space-y-5">
        {!isEdit && (
          <button
            type="button"
            onClick={() => setShowTemplates(true)}
            className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-primary/30 text-primary hover:bg-primary/5 transition-colors"
          >
            <Sparkles size={20} />
            <span className="font-medium">从模板快速创建</span>
          </button>
        )}

        <GlassCard className="p-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              名称 <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="给你的 AI 好友起个名字"
              className="w-full px-4 py-2.5 rounded-xl bg-muted border border-transparent focus:border-primary focus:outline-none transition-colors text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              人设描述
            </label>
            <textarea
              value={form.persona}
              onChange={(e) => setForm((f) => ({ ...f, persona: e.target.value }))}
              placeholder="描述一下这个 AI 好友的性格、背景、说话方式..."
              rows={5}
              className="w-full px-4 py-2.5 rounded-xl bg-muted border border-transparent focus:border-primary focus:outline-none transition-colors text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              开场白
            </label>
            <textarea
              value={form.greeting}
              onChange={(e) => setForm((f) => ({ ...f, greeting: e.target.value }))}
              placeholder="打开聊天时说的第一句话"
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl bg-muted border border-transparent focus:border-primary focus:outline-none transition-colors text-foreground"
            />
          </div>
        </GlassCard>

        <GlassCard className="p-5 space-y-5">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Sparkles size={18} className="text-primary" />
            模型配置
          </h2>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              模型提供商
            </label>
            <div className="grid grid-cols-2 gap-2">
              {modelProviders.map((provider) => (
                <button
                  key={provider.value}
                  type="button"
                  onClick={() => handleProviderChange(provider.value)}
                  className={cn(
                    'px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                    form.modelProvider === provider.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground hover:bg-muted/80'
                  )}
                >
                  {provider.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              模型名称
            </label>
            <input
              type="text"
              value={form.modelName}
              onChange={(e) => setForm((f) => ({ ...f, modelName: e.target.value }))}
              placeholder="如 deepseek-chat, gpt-4o-mini"
              className="w-full px-4 py-2.5 rounded-xl bg-muted border border-transparent focus:border-primary focus:outline-none transition-colors text-foreground"
            />
          </div>

          {form.modelProvider === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                API 端点
              </label>
              <input
                type="text"
                value={form.apiEndpoint}
                onChange={(e) => setForm((f) => ({ ...f, apiEndpoint: e.target.value }))}
                placeholder="https://api.example.com/v1/chat/completions"
                className="w-full px-4 py-2.5 rounded-xl bg-muted border border-transparent focus:border-primary focus:outline-none transition-colors text-foreground"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              API Key
            </label>
            <input
              type="password"
              value={form.apiKey}
              onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
              placeholder="sk-..."
              className="w-full px-4 py-2.5 rounded-xl bg-muted border border-transparent focus:border-primary focus:outline-none transition-colors text-foreground"
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              API Key 仅保存在本地服务器，不会泄露
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              温度：{form.temperature.toFixed(1)}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={form.temperature}
              onChange={(e) => setForm((f) => ({ ...f, temperature: parseFloat(e.target.value) }))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>严谨</span>
              <span>创意</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              最大 Token：{form.maxTokens}
            </label>
            <input
              type="range"
              min="512"
              max="8192"
              step="256"
              value={form.maxTokens}
              onChange={(e) => setForm((f) => ({ ...f, maxTokens: parseInt(e.target.value) }))}
              className="w-full accent-primary"
            />
          </div>
        </GlassCard>
      </form>

      <Modal open={showTemplates} onClose={() => setShowTemplates(false)} title="选择模板">
        <div className="space-y-3">
          {agentTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => handleTemplateSelect(template)}
              className="w-full text-left p-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-2xl">
                  {template.avatarEmoji}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground">{template.name}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {template.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </Modal>
    </main>
  );
}
