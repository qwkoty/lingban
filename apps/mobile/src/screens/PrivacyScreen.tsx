import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useTheme } from '../theme/ThemeContext';

export function PrivacyScreen() {
  const { colors } = useTheme();
  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>隐私政策</Text>
        <Text style={[styles.p, { color: colors.textSecondary }]}>
          灵伴（以下简称「本应用」）尊重并保护所有用户的个人隐私。本政策将帮助您了解我们如何收集、使用和保护您的信息。
        </Text>

        <Text style={[styles.h2, { color: colors.text }]}>1. 信息收集</Text>
        <Text style={[styles.p, { color: colors.textSecondary }]}>
          本应用采用匿名使用方式，不会要求您注册账号或提供手机号、邮箱等个人身份信息。我们仅会在您首次使用时为当前设备生成一个匿名标识符，用于区分不同用户及其创建的智能体数据。
        </Text>

        <Text style={[styles.h2, { color: colors.text }]}>2. 数据存储</Text>
        <Text style={[styles.p, { color: colors.textSecondary }]}>
          您创建的智能体配置、对话记录等信息均存储在由您或运营方指定的服务器中。本应用不会将您的对话内容用于任何模型训练或商业分析。
        </Text>

        <Text style={[styles.h2, { color: colors.text }]}>3. API Key 安全</Text>
        <Text style={[styles.p, { color: colors.textSecondary }]}>
          您为智能体配置的第三方模型 API Key 仅用于向对应的模型服务商发起对话请求。本应用不会将您的 API Key 泄露给任何无关第三方，但建议您妥善保管并定期更换密钥。
        </Text>

        <Text style={[styles.h2, { color: colors.text }]}>4. 信息披露</Text>
        <Text style={[styles.p, { color: colors.textSecondary }]}>
          除非法律法规要求，或为了维护本应用合法权益所必需，我们不会向任何第三方披露您的信息。
        </Text>

        <Text style={[styles.h2, { color: colors.text }]}>5. 政策更新</Text>
        <Text style={[styles.p, { color: colors.textSecondary }]}>
          我们可能会不时更新本隐私政策。更新后的政策将在本页面公布，继续使用本应用即视为您同意更新后的内容。
        </Text>

        <Text style={[styles.p, { color: colors.textSecondary, marginTop: 24 }]}>生效日期：2026 年 6 月 17 日</Text>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  h2: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
  },
  p: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
  },
});
