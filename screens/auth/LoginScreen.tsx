import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import { COLORS, RADIUS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { AuthScreenFrame } from './AuthScreenFrame';

interface LoginScreenProps {
  returnTo: string;
  authPath?: '/auth' | '/account';
}

export function LoginScreen({ returnTo, authPath = '/auth' }: LoginScreenProps) {
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const canSubmit = useMemo(() => {
    return email.trim().includes('@') && password.length >= 6 && !submitting;
  }, [email, password, submitting]);

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setMessage('');

    try {
      await auth.signIn(email, password);
      router.replace(returnTo as any);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Kimlik doğrulama sırasında hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthScreenFrame
      title="Giriş yap"
      subtitle="Hesabınıza erişmek için oturum açın."
    >
      <Text style={styles.label}>E-posta</Text>
      <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" placeholder="ornek@mail.com" placeholderTextColor={COLORS.textMuted} style={styles.input} />

      <Text style={styles.label}>Şifre</Text>
      <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="En az 6 karakter" placeholderTextColor={COLORS.textMuted} style={styles.input} />

      {!!message && <Text style={styles.message}>{message}</Text>}

      <TouchableOpacity accessibilityRole="button" disabled={!canSubmit} style={[styles.submit, !canSubmit && styles.submitDisabled]} onPress={handleSubmit}>
        {submitting ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.submitText}>Giriş yap</Text>}
      </TouchableOpacity>

      <TouchableOpacity accessibilityRole="button" style={styles.modeButton} onPress={() => router.replace(`${authPath}?mode=register&returnTo=${encodeURIComponent(returnTo)}` as any)}>
        <Text style={styles.modeText}>Hesabın yok mu? Hesap oluştur</Text>
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" style={styles.modeButton} onPress={() => router.replace(`${authPath}?mode=forgot-password&returnTo=${encodeURIComponent(returnTo)}` as any)}>
        <Text style={styles.secondaryModeText}>Şifremi unuttum</Text>
      </TouchableOpacity>
    </AuthScreenFrame>
  );
}

const styles = StyleSheet.create({
  label: { color: COLORS.textPrimary, fontSize: 12, fontWeight: '900', marginBottom: 7 },
  input: { backgroundColor: COLORS.background, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.borderLight, color: COLORS.textPrimary, fontSize: 15, marginBottom: 12, paddingHorizontal: 12, paddingVertical: 12 },
  message: { color: COLORS.textSecondary, fontWeight: '700', lineHeight: 20, marginBottom: 12 },
  submit: { alignItems: 'center', borderRadius: RADIUS.md, backgroundColor: COLORS.primaryMid, paddingVertical: 14, marginTop: 2 },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: COLORS.white, fontWeight: '900' },
  modeButton: { alignItems: 'center', paddingVertical: 10 },
  modeText: { color: COLORS.primaryMid, fontWeight: '900' },
  secondaryModeText: { color: COLORS.textSecondary, fontWeight: '800' },
});
