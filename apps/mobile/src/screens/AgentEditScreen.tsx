import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { AvatarCircle } from '../components/AvatarCircle';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Agent, Provider, PROVIDER_PRESETS } from '../types';
import { avatarColors } from '../theme/colors';
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
  const [avatarColor, setAvatarColor] = useState(existing?.avatarUrl || avatarColors[0]);
  const [saving, setSaving] = useState(false);

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

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <FadeIn>
            <View style={styles.avatarSection}>
              <AvatarCircle name={name || 'A'} color={avatarColor} size={80} />
              <View style={styles.colorRow}>
                {avatarColors.map((c, i) => (
                  <StaggerItem key={c} index={i}>
                    <ScalePress
                      scale={0.85}
                      onPress={() => setAvatarColor(c)}
                      style={[
                        styles.colorDot,
                        { backgroundColor: c },
                        avatarColor === c && { borderColor: colors.text, borderWidth: 2.5 },
                      ]}
                    />
                  </StaggerItem>
                ))}
              </View>
            </View>
          </FadeIn>

          <Text style={[styles.label, { color: colors.text }]}>名称</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="给智能体起个名字"
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
          />

          <Text style={[styles.label, { color: colors.text }]}>模型提供商</Text>
          <View style={styles.providerRow}>
            {(Object.keys(PROVIDER_PRESETS) as Provider[]).map((p, i) => (
              <StaggerItem key={p} index={i}>
                <ScalePress
                  scale={0.95}
                  onPress={() => setProvider(p)}
                  style={[
                    styles.providerChip,
                    {
                      backgroundColor: provider === p ? colors.primary : colors.inputBackground,
                      borderColor: provider === p ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={{ color: provider === p ? colors.textInverse : colors.text, fontWeight: '700' }}>
                    {PROVIDER_PRESETS[p].label}
                  </Text>
                </ScalePress>
              </StaggerItem>
            ))}
          </View>

          <Text style={[styles.label, { color: colors.text }]}>模型</Text>
          <TextInput
            value={model}
            onChangeText={setModel}
            placeholder="例如 deepseek-chat"
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
          />

          <Text style={[styles.label, { color: colors.text }]}>API Key</Text>
          <TextInput
            value={apiKey}
            onChangeText={setApiKey}
            placeholder="sk-..."
            placeholderTextColor={colors.textSecondary}
            secureTextEntry
            style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
          />

          {provider === 'custom' && (
            <>
              <Text style={[styles.label, { color: colors.text }]}>API URL</Text>
              <TextInput
                value={apiUrl}
                onChangeText={setApiUrl}
                placeholder="https://.../chat/completions"
                placeholderTextColor={colors.textSecondary}
                style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
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
            style={[styles.textArea, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
          />

          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={[styles.label, { color: colors.text }]}>Temperature</Text>
              <TextInput
                value={temperature}
                onChangeText={setTemperature}
                keyboardType="decimal-pad"
                style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
              />
            </View>
            <View style={styles.half}>
              <Text style={[styles.label, { color: colors.text }]}>Max Tokens</Text>
              <TextInput
                value={maxTokens}
                onChangeText={setMaxTokens}
                keyboardType="number-pad"
                style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
              />
            </View>
          </View>

          <ScalePress scale={0.97} disabled={saving} onPress={handleSave}>
            <View style={[styles.saveButton, { backgroundColor: colors.primary }]}>
              <Text style={[styles.saveText, { color: colors.textInverse }]}>{saving ? '保存中...' : '保存'}</Text>
            </View>
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
  },
  colorRow: {
    flexDirection: 'row',
    marginTop: 18,
  },
  colorDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginHorizontal: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 18,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 15,
    fontSize: 15,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingTop: 13,
    fontSize: 15,
    minHeight: 110,
    textAlignVertical: 'top',
  },
  providerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  providerChip: {
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 22,
    borderWidth: 1,
    marginRight: 10,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  half: {
    width: '47%',
  },
  saveButton: {
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '800',
  },
});
