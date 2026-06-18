import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { AvatarCircle } from '../components/AvatarCircle';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Agent, Provider, PROVIDER_PRESETS } from '../types';
import { avatarGradients } from '../theme/colors';
import { RootStackParamList } from '../navigation/AppNavigator';
import { ScalePress, FadeIn, StaggerItem } from '../components/animations';

type EditRoute = RouteProp<RootStackParamList, 'AgentEdit'>;
type EditNav = NativeStackNavigationProp<RootStackParamList>;

export function AgentEditScreen() {
  const { colors } = useTheme();
  const { api } = useAuth();
  const navigation = useNavigation<EditNav>();
  const route = useRoute<EditRoute>();
  const existing = route.params?.agent;

  const [name, setName] = useState(existing?.name || '');
  const [provider, setProvider] = useState<Provider>(existing?.provider || 'deepseek');
  const [model, setModel] = useState(existing?.model || PROVIDER_PRESETS.deepseek.defaultModel);
  const [apiKey, setApiKey] = useState(existing?.apiKey || '');
  const [apiUrl, setApiUrl] = useState(existing?.apiUrl || '');
  const [systemPrompt, setSystemPrompt] = useState(existing?.systemPrompt || '');
  const [temperature, setTemperature] = useState(String(existing?.temperature ?? 0.7));
  const [maxTokens, setMaxTokens] = useState(String(existing?.maxTokens ?? 2048));
  const [avatarColor, setAvatarColor] = useState(existing?.avatarUrl || avatarGradients[0].id);
  const [saving, setSaving] = useState(false);

  // NVIDIA 自动拉取模型
  const [nvidiaModels, setNvidiaModels] = useState<string[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modelRef = useRef(model);
  useEffect(() => { modelRef.current = model; }, [model]);

  const fetchNvidiaModels = useCallback(
    async (key: string) => {
      if (!key.trim()) {
        setNvidiaModels([]);
        setFetchError(null);
        return;
      }
      setFetchingModels(true);
      setFetchError(null);
      try {
        const resp = await api.get('/api/models/nvidia', {
          headers: { Authorization: `Bearer ${key.trim()}` },
        });
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
      } catch (err: any) {
        setNvidiaModels([]);
        const msg = err?.response?.data?.error || err?.message || '拉取失败';
        setFetchError(msg);
      } finally {
        setFetchingModels(false);
      }
    },
    [api]
  );

  useEffect(() => {
    if (provider !== 'nvidia') {
      setNvidiaModels([]);
      setFetchError(null);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchNvidiaModels(apiKey);
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [provider, apiKey, fetchNvidiaModels]);

  useEffect(() => {
    if (!existing) {
      const preset = PROVIDER_PRESETS[provider];
      setModel(preset.defaultModel);
      if (provider === 'custom') setApiUrl('');
      else setApiUrl(preset.defaultApiUrl);
    }
  }, [provider, existing]);

  const validate = () => {
    if (!name.trim()) return '请输入智能体名称';
    if (!model.trim()) return '请输入模型名称';
    if (!apiKey.trim()) return '请输入 API Key';
    if (provider === 'custom' && !apiUrl.trim()) return '自定义 provider 必须填写 API URL';
    const t = parseFloat(temperature);
    if (isNaN(t) || t < 0 || t > 2) return 'Temperature 必须在 0-2 之间';
    const m = parseInt(maxTokens, 10);
    if (isNaN(m) || m < 1) return 'Max Tokens 必须大于 0';
    return null;
  };

  const handleSave = async () => {
    const error = validate();
    if (error) {
      Alert.alert('校验失败', error);
      return;
    }
    setSaving(true);
    const payload = {
      name: name.trim(),
      provider,
      model: model.trim(),
      apiKey: apiKey.trim(),
      apiUrl: provider === 'custom' ? apiUrl.trim() : undefined,
      systemPrompt: systemPrompt.trim() || undefined,
      temperature: parseFloat(temperature),
      maxTokens: parseInt(maxTokens, 10),
      avatarUrl: avatarColor,
    };
    try {
      if (existing) {
        await api.put(`/api/agents/${existing.id}`, payload);
      } else {
        await api.post('/api/agents', payload);
      }
      navigation.goBack();
    } catch (err) {
      Alert.alert('保存失败', err instanceof Error ? err.message : '未知错误');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = [
    styles.input,
    {
      backgroundColor: colors.inputBackground,
      color: colors.text,
      borderColor: colors.border,
    },
  ];

  const textAreaStyle = [
    styles.textArea,
    {
      backgroundColor: colors.inputBackground,
      color: colors.text,
      borderColor: colors.border,
    },
  ];

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <FadeIn>
            <View style={[styles.avatarSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.avatarGlow}>
                <AvatarCircle name={name || 'A'} color={avatarColor} size={80} />
              </View>
              <View style={styles.colorRow}>
                {avatarGradients.map((g, i) => {
                  const selected = avatarColor === g.id;
                  return (
                    <StaggerItem key={g.id} index={i}>
                      <ScalePress
                        scale={0.85}
                        onPress={() => setAvatarColor(g.id)}
                        style={[
                          styles.colorDotWrap,
                          selected && { borderColor: colors.text, borderWidth: 2 },
                        ]}
                      >
                        <LinearGradient
                          colors={g.colors}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.colorDot}
                        />
                      </ScalePress>
                    </StaggerItem>
                  );
                })}
              </View>
            </View>
          </FadeIn>

          <Text style={[styles.label, { color: colors.text }]}>名称</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="给智能体起个名字"
            placeholderTextColor={colors.textSecondary}
            style={inputStyle}
          />

          <Text style={[styles.label, { color: colors.text }]}>模型提供商</Text>
          <View style={styles.providerRow}>
            {(Object.keys(PROVIDER_PRESETS) as Provider[]).map((p, i) => {
              const selected = provider === p;
              return (
                <StaggerItem key={p} index={i}>
                  <ScalePress
                    scale={0.95}
                    onPress={() => setProvider(p)}
                    style={[
                      styles.providerChipWrap,
                      !selected && {
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    {selected ? (
                      <LinearGradient
                        colors={colors.gradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.providerChipGradient}
                      >
                        <Text style={[styles.providerChipText, { color: colors.textInverse }]}>
                          {PROVIDER_PRESETS[p].label}
                        </Text>
                      </LinearGradient>
                    ) : (
                      <Text style={[styles.providerChipText, { color: colors.text }]}>
                        {PROVIDER_PRESETS[p].label}
                      </Text>
                    )}
                  </ScalePress>
                </StaggerItem>
              );
            })}
          </View>

          <Text style={[styles.label, { color: colors.text }]}>模型</Text>
          {provider === 'nvidia' ? (
            // NVIDIA: 输入 API key 后自动拉取模型列表
            !apiKey.trim() ? (
              <View style={[styles.hintBox, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                <Text style={[styles.hintText, { color: colors.textSecondary }]}>
                  请先输入 API Key，系统将自动拉取可用模型列表
                </Text>
              </View>
            ) : fetchingModels ? (
              <View style={[styles.hintBox, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                <ActivityIndicator color={colors.primary} size="small" />
                <Text style={[styles.hintText, { color: colors.textSecondary, marginLeft: 8 }]}>
                  正在拉取可用模型...
                </Text>
              </View>
            ) : fetchError ? (
              <View>
                <View style={[styles.hintBox, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                  <Text style={[styles.hintText, { color: '#ff6b6b' }]}>
                    拉取失败：{fetchError}
                  </Text>
                </View>
                <Text style={[styles.label, { color: colors.textSecondary, fontSize: 12, marginTop: 8 }]}>
                  手动输入模型名称
                </Text>
                <TextInput
                  value={model}
                  onChangeText={setModel}
                  placeholder="meta/llama3-70b-instruct"
                  placeholderTextColor={colors.textSecondary}
                  style={inputStyle}
                />
              </View>
            ) : nvidiaModels.length > 0 ? (
              <View style={styles.modelList}>
                {nvidiaModels.map((m, i) => {
                  const selected = model === m;
                  return (
                    <StaggerItem key={m} index={i}>
                      <ScalePress
                        scale={0.96}
                        onPress={() => setModel(m)}
                        style={[
                          styles.modelCard,
                          selected
                            ? { borderColor: colors.primary, borderWidth: 2 }
                            : { backgroundColor: colors.inputBackground, borderColor: colors.border, borderWidth: 1 },
                        ]}
                      >
                        <Text style={[styles.modelLabel, { color: colors.text, fontSize: 13 }]} numberOfLines={2}>
                          {m}
                        </Text>
                        {selected && (
                          <LinearGradient
                            colors={colors.gradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.modelCheck}
                          >
                            <Text style={[styles.modelCheckText, { color: colors.textInverse }]}>
                              已选
                            </Text>
                          </LinearGradient>
                        )}
                      </ScalePress>
                    </StaggerItem>
                  );
                })}
              </View>
            ) : (
              <TextInput
                value={model}
                onChangeText={setModel}
                placeholder="输入模型名称"
                placeholderTextColor={colors.textSecondary}
                style={inputStyle}
              />
            )
          ) : provider !== 'custom' && PROVIDER_PRESETS[provider].models.length > 0 ? (
            <View style={styles.modelList}>
              {PROVIDER_PRESETS[provider].models.map((m, i) => {
                const selected = model === m.id;
                return (
                  <StaggerItem key={m.id} index={i}>
                    <ScalePress
                      scale={0.96}
                      onPress={() => setModel(m.id)}
                      style={[
                        styles.modelCard,
                        selected
                          ? { borderColor: colors.primary, borderWidth: 2 }
                          : { backgroundColor: colors.inputBackground, borderColor: colors.border, borderWidth: 1 },
                      ]}
                    >
                      <Text style={[styles.modelLabel, { color: colors.text }]}>
                        {m.label}
                      </Text>
                      <Text style={[styles.modelDesc, { color: colors.textSecondary }]}>
                        {m.desc}
                      </Text>
                      {selected && (
                        <LinearGradient
                          colors={colors.gradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.modelCheck}
                        >
                          <Text style={[styles.modelCheckText, { color: colors.textInverse }]}>
                            已选
                          </Text>
                        </LinearGradient>
                      )}
                    </ScalePress>
                  </StaggerItem>
                );
              })}
            </View>
          ) : (
            <TextInput
              value={model}
              onChangeText={setModel}
              placeholder="输入模型名称"
              placeholderTextColor={colors.textSecondary}
              style={inputStyle}
            />
          )}

          <Text style={[styles.label, { color: colors.text }]}>API Key</Text>
          <TextInput
            value={apiKey}
            onChangeText={setApiKey}
            placeholder="sk-..."
            placeholderTextColor={colors.textSecondary}
            secureTextEntry
            style={inputStyle}
          />

          {provider === 'custom' && (
            <>
              <Text style={[styles.label, { color: colors.text }]}>API URL</Text>
              <TextInput
                value={apiUrl}
                onChangeText={setApiUrl}
                placeholder="https://.../chat/completions"
                placeholderTextColor={colors.textSecondary}
                style={inputStyle}
              />
            </>
          )}

          <Text style={[styles.label, { color: colors.text }]}>系统提示词（可选）</Text>
          <TextInput
            value={systemPrompt}
            onChangeText={setSystemPrompt}
            placeholder="设定智能体的角色和行为"
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            style={textAreaStyle}
          />

          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={[styles.label, { color: colors.text }]}>Temperature</Text>
              <TextInput
                value={temperature}
                onChangeText={setTemperature}
                keyboardType="decimal-pad"
                style={inputStyle}
              />
            </View>
            <View style={styles.half}>
              <Text style={[styles.label, { color: colors.text }]}>Max Tokens</Text>
              <TextInput
                value={maxTokens}
                onChangeText={setMaxTokens}
                keyboardType="number-pad"
                style={inputStyle}
              />
            </View>
          </View>

          <ScalePress scale={0.97} disabled={saving} onPress={handleSave}>
            <LinearGradient
              colors={colors.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveButton}
            >
              <Text style={[styles.saveText, { color: colors.textInverse }]}>
                {saving ? '保存中...' : '保存'}
              </Text>
            </LinearGradient>
          </ScalePress>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 22,
    paddingBottom: 44,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 28,
    paddingVertical: 28,
    borderRadius: 22,
    borderWidth: 1,
  },
  avatarGlow: {
    marginBottom: 8,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 18,
    justifyContent: 'center',
    maxWidth: 200,
    alignSelf: 'center',
  },
  colorDotWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginHorizontal: 6,
    marginVertical: 6,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
    padding: 0,
  },
  colorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignSelf: 'center',
    margin: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 18,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 14,
    fontSize: 15,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  providerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  providerChipWrap: {
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 10,
    marginBottom: 10,
    overflow: 'hidden',
  },
  providerChipGradient: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  providerChipText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  half: {
    width: '47%',
  },
  saveButton: {
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '800',
  },
  modelList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  modelCard: {
    width: '48%',
    flexGrow: 1,
    borderRadius: 16,
    padding: 14,
    position: 'relative',
  },
  modelLabel: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  modelDesc: {
    fontSize: 12,
  },
  modelCheck: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  modelCheckText: {
    fontSize: 10,
    fontWeight: '700',
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
  },
  hintText: {
    fontSize: 13,
  },
});
