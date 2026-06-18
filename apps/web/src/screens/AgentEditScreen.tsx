import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { api } from '../api/client';
import { useTheme } from '../theme/useTheme';
import { avatarGradients } from '../theme/colors';
import { PROVIDER_PRESETS } from '../types';
import type { Agent, Provider } from '../types';

function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.error || err.message;
  }
  if (err instanceof Error) return err.message;
  return 'Unknown error';
}

export function AgentEditScreen() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { colors } = useTheme();
  const isEdit = Boolean(id);

  const [name, setName] = useState('');
  const [provider, setProviderState] = useState<Provider>('deepseek');
  const [model, setModel] = useState(PROVIDER_PRESETS.deepseek.defaultModel);
  const [apiKey, setApiKey] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [temperature, setTemperature] = useState('0.7');
  const [maxTokens, setMaxTokens] = useState('2048');
  const [avatarColor, setAvatarColor] = useState(avatarGradients[0].id);
  const [saving, setSaving] = useState(false);

  const [nvidiaModels, setNvidiaModels] = useState<string[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modelRef = useRef(model);

  useEffect(() => {
    modelRef.current = model;
  }, [model]);

  // 加载编辑数据
  useEffect(() => {
    if (isEdit && id) {
      api.get(`/api/agents/${id}`).then((res) => {
        const a: Agent = res.data.agent;
        setName(a.name);
        setProviderState(a.provider);
        setModel(a.model);
        // 后端不再返回 apiKey，编辑时需要重新输入才能更新
        setApiKey('');
        setApiUrl(a.apiUrl || '');
        setSystemPrompt(a.systemPrompt || '');
        setTemperature(String(a.temperature));
        setMaxTokens(String(a.maxTokens));
        setAvatarColor(a.avatarUrl || avatarGradients[0].id);
      });
    }
  }, [isEdit, id]);

  const setProvider = useCallback((p: Provider) => {
    setProviderState(p);
    if (!isEdit) {
      setModel(PROVIDER_PRESETS[p].defaultModel);
      setApiUrl(p === 'custom' ? '' : PROVIDER_PRESETS[p].defaultApiUrl);
    }
    setNvidiaModels([]);
    setFetchError(null);
  }, [isEdit]);

  const fetchNvidiaModels = useCallback(async (key: string) => {
    setNvidiaModels([]);
    setFetchError(null);
    if (!key.trim()) {
      setFetchingModels(false);
      return;
    }
    setFetchingModels(true);
    try {
      const resp = await api.get('/api/models/nvidia', { headers: { Authorization: `Bearer ${key.trim()}` } });
      const data = resp.data;
      if (data.success && Array.isArray(data.models)) {
        setNvidiaModels(data.models);
        if (data.models.length > 0 && !data.models.includes(modelRef.current)) {
          setModel(data.models[0]);
        }
      } else {
        setNvidiaModels([]);
        setFetchError(data.error || '拉取失败');
      }
    } catch (err: unknown) {
      setNvidiaModels([]);
      setFetchError(getErrorMessage(err));
    } finally {
      setFetchingModels(false);
    }
  }, []);

  useEffect(() => {
    if (provider !== 'nvidia') return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchNvidiaModels(apiKey), 600);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [provider, apiKey, fetchNvidiaModels]);

  const validate = () => {
    if (!name.trim()) return '请输入智能体名称';
    if (!model.trim()) return '请输入模型名称';
    if (!isEdit && !apiKey.trim()) return '请输入 API Key';
    if (provider === 'custom' && !apiUrl.trim()) return '自定义 provider 必须填写 API URL';
    const t = parseFloat(temperature);
    if (isNaN(t) || t < 0 || t > 2) return 'Temperature 必须在 0-2 之间';
    const m = parseInt(maxTokens, 10);
    if (isNaN(m) || m < 1) return 'Max Tokens 必须大于 0';
    return null;
  };

  const handleSave = async () => {
    const error = validate();
    if (error) { alert(error); return; }
    setSaving(true);

    const payload: Record<string, unknown> = {
      name: name.trim(),
      provider,
      model: model.trim(),
      systemPrompt: systemPrompt.trim() || undefined,
      temperature: parseFloat(temperature),
      maxTokens: parseInt(maxTokens, 10),
      avatarUrl: avatarColor,
    };
    if (apiKey.trim()) {
      payload.apiKey = apiKey.trim();
    }
    if (provider === 'custom') {
      payload.apiUrl = apiUrl.trim();
    }

    try {
      if (isEdit) await api.put(`/api/agents/${id}`, payload);
      else await api.post('/api/agents', payload);
      navigate('/agents');
    } catch (err: unknown) {
      alert('保存失败: ' + getErrorMessage(err));
    } finally { setSaving(false); }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 48, borderRadius: 14, padding: '0 14px',
    fontSize: 14, border: `1px solid ${colors.border}`,
    background: colors.inputBackground, color: colors.text,
    outline: 'none', boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 13, fontWeight: 700, marginBottom: 8, marginTop: 18, display: 'block',
  };

  return (
    <div style={{ minHeight: '100vh', padding: 20, paddingBottom: 60 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
        <button onClick={() => navigate('/agents')} style={{ background: 'none', border: 'none', color: colors.text, fontSize: 20, cursor: 'pointer', marginRight: 12 }}>←</button>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{isEdit ? '编辑智能体' : '新建智能体'}</h1>
      </div>

      {/* Avatar */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24, padding: 24, borderRadius: 18, background: colors.surface, border: `1px solid ${colors.border}` }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: `linear-gradient(135deg, ${avatarGradients.find(g => g.id === avatarColor)?.colors[0]}, ${avatarGradients.find(g => g.id === avatarColor)?.colors[1]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: colors.textInverse }}>
          {name.charAt(0) || 'A'}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 16, maxWidth: 220 }}>
          {avatarGradients.map((g) => (
            <button key={g.id} onClick={() => setAvatarColor(g.id)} style={{ width: 24, height: 24, borderRadius: '50%', border: avatarColor === g.id ? `2px solid ${colors.text}` : '2px solid transparent', padding: 0, background: `linear-gradient(135deg, ${g.colors[0]}, ${g.colors[1]})`, cursor: 'pointer' }} />
          ))}
        </div>
      </div>

      <label style={labelStyle}>名称</label>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="给智能体起个名字" style={inputStyle} />

      <label style={labelStyle}>模型提供商</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {(Object.keys(PROVIDER_PRESETS) as Provider[]).map((p) => {
          const selected = provider === p;
          return (
            <button key={p} onClick={() => setProvider(p)} style={{
              padding: '10px 16px', borderRadius: 20, border: `1px solid ${selected ? 'transparent' : colors.border}`,
              background: selected ? `linear-gradient(90deg, ${colors.gradient[0]}, ${colors.gradient[1]})` : colors.inputBackground,
              color: selected ? colors.textInverse : colors.text, fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}>
              {p === 'qwen' ? <img src="/qwen-logo.png" alt="qwen" style={{ width: 18, height: 18, verticalAlign: 'middle' }} /> : PROVIDER_PRESETS[p].label}
            </button>
          );
        })}
      </div>

      <label style={labelStyle}>模型</label>
      {provider === 'nvidia' ? (
        !apiKey.trim() ? (
          <div style={{ padding: 14, borderRadius: 14, background: colors.inputBackground, border: `1px solid ${colors.border}`, color: colors.textSecondary, fontSize: 13 }}>请先输入 API Key，系统将自动拉取可用模型列表</div>
        ) : fetchingModels ? (
          <div style={{ padding: 14, borderRadius: 14, background: colors.inputBackground, border: `1px solid ${colors.border}`, color: colors.textSecondary, fontSize: 13 }}>正在拉取可用模型...</div>
        ) : fetchError ? (
          <div>
            <div style={{ padding: 14, borderRadius: 14, background: colors.inputBackground, border: `1px solid ${colors.border}`, color: colors.danger, fontSize: 13 }}>拉取失败：{fetchError}</div>
            <label style={{ ...labelStyle, fontSize: 12, color: colors.textSecondary }}>手动输入模型名称</label>
            <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="meta/llama3-70b-instruct" style={inputStyle} />
          </div>
        ) : nvidiaModels.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {nvidiaModels.map((m) => {
              const selected = model === m;
              return (
                <button key={m} onClick={() => setModel(m)} style={{
                  padding: 12, borderRadius: 14, border: `1px solid ${selected ? colors.primary : colors.border}`,
                  background: selected ? 'transparent' : colors.inputBackground, color: colors.text, fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', flex: '1 1 45%', textAlign: 'left', position: 'relative',
                }}>
                  {m}
                  {selected && <span style={{ position: 'absolute', top: 8, right: 8, padding: '2px 8px', borderRadius: 10, background: `linear-gradient(90deg, ${colors.gradient[0]}, ${colors.gradient[1]})`, color: colors.textInverse, fontSize: 10, fontWeight: 700 }}>已选</span>}
                </button>
              );
            })}
          </div>
        ) : <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="输入模型名称" style={inputStyle} />
      ) : provider !== 'custom' && PROVIDER_PRESETS[provider].models.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {PROVIDER_PRESETS[provider].models.map((m) => {
            const selected = model === m.id;
            return (
              <button key={m.id} onClick={() => setModel(m.id)} style={{
                padding: 12, borderRadius: 14, border: `1px solid ${selected ? colors.primary : colors.border}`,
                background: selected ? 'transparent' : colors.inputBackground, color: colors.text, fontSize: 14, fontWeight: 700,
                cursor: 'pointer', flex: '1 1 45%', textAlign: 'left', position: 'relative',
              }}>
                <div>{m.label}</div>
                <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{m.desc}</div>
                {selected && <span style={{ position: 'absolute', top: 8, right: 8, padding: '2px 8px', borderRadius: 10, background: `linear-gradient(90deg, ${colors.gradient[0]}, ${colors.gradient[1]})`, color: colors.textInverse, fontSize: 10, fontWeight: 700 }}>已选</span>}
              </button>
            );
          })}
        </div>
      ) : <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="输入模型名称" style={inputStyle} />}

      <label style={labelStyle}>API Key</label>
      <input value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder={isEdit ? '留空表示不更新' : 'sk-...'} type="password" style={inputStyle} />

      {provider === 'custom' && (
        <>
          <label style={labelStyle}>API URL</label>
          <input value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} placeholder="https://.../chat/completions" style={inputStyle} />
        </>
      )}

      <label style={labelStyle}>系统提示词（可选）</label>
      <textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} placeholder="设定智能体的角色和行为" rows={4} style={{ ...inputStyle, height: 'auto', padding: 14, resize: 'vertical' }} />

      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Temperature</label>
          <input value={temperature} onChange={(e) => setTemperature(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Max Tokens</label>
          <input value={maxTokens} onChange={(e) => setMaxTokens(e.target.value)} style={inputStyle} />
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} style={{
        width: '100%', height: 52, borderRadius: 16, border: 'none',
        background: `linear-gradient(90deg, ${colors.gradient[0]}, ${colors.gradient[1]})`,
        color: colors.textInverse, fontSize: 16, fontWeight: 800, cursor: 'pointer', marginTop: 30,
      }}>
        {saving ? '保存中...' : '保存'}
      </button>
    </div>
  );
}
