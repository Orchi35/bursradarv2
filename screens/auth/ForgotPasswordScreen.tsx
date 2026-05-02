import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import { COLORS, RADIUS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { AuthScreenFrame } from './AuthScreenFrame';

interface ForgotPasswordScreenProps {
  returnTo: string;
  authPath?: '/auth' | '/account';
}

export function ForgotPasswordScreen({ returnTo, authPath = '/auth' }: ForgotPasswordScreenProps) {
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const canSubmit = useMemo(() => {
    return email.trim().includes('@') && !submitting;
  }, [email, submitting]);

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setMessage('');

    try {
      await auth.resetPassword(email);
      setMessage('Şifre sıfırlama bağlantısı e-posta adresine gönderildi.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Şifre sıfırlama sırasında hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthScreenFrame icon="envelope" title="Şifremi unuttum" subtitle="Hesabına ait e-posta adresini yaz, şifre sıfırlama bağlantısını gönderelim.">
      <Text style={styles.label}>E-posta</Text>
      <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" placeholder="ornek@mail.com" placeholderTextColor={COLORS.textMuted} style={styles.input} />

      {!!message && <Text style={styles.message}>{message}</Text>}

      <TouchableOpacity accessibilityRole="button" disabled={!canSubmit} style={[styles.submit, !canSubmit && styles.submitDisabled]} onPress={handleSubmit}>
        {submitting ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.submitText}>Bağlantı gönder</Text>}
      </TouchableOpacity>

      <TouchableOpacity accessibilityRole="button" style={styles.modeButton} onPress={() => router.replace(`${authPath}?mode=login&returnTo=${encodeURIComponent(returnTo)}` as any)}>
        <Text style={styles.modeText}>Giriş ekranına dön</Text>
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
  modeButton: { alignItems: 'center', paddingVertical: 14 },
  modeText: { color: COLORS.primaryMid, fontWeight: '900' },
});
