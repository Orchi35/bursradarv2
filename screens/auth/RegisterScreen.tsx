import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import { COLORS, RADIUS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { AuthScreenFrame } from './AuthScreenFrame';

interface RegisterScreenProps {
  returnTo: string;
  authPath?: '/auth' | '/account';
}

export function RegisterScreen({ returnTo, authPath = '/auth' }: RegisterScreenProps) {
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState('');
  const [confirmationEmail, setConfirmationEmail] = useState('');

  const canSubmit = useMemo(() => {
    return email.trim().includes('@') && password.length >= 6 && !submitting;
  }, [email, password, submitting]);

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setMessage('');

    try {
      const { session } = await auth.signUp(email, password);
      if (session) {
        router.replace(returnTo as any);
      } else {
        setConfirmationEmail(email.trim());
        setMessage('Dogrulama baglantisi e-posta adresinize gonderildi. Hesabinizi etkinlestirmek icin gelen kutunuzu kontrol edin.');
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Hesap oluşturma sırasında hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    const targetEmail = confirmationEmail || email.trim();
    if (!targetEmail) return;
    setResending(true);
    setMessage('');
    try {
      await auth.resendSignupConfirmation(targetEmail);
      setConfirmationEmail(targetEmail);
      setMessage('Dogrulama baglantisi tekrar gonderildi. Gelen kutunuzu ve spam klasorunuzu kontrol edin.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Dogrulama baglantisi tekrar gonderilemedi.');
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthScreenFrame icon="user-plus" title="Hesap oluştur" subtitle="Planını, favorilerini ve hatırlatmalarını kalıcı olarak hesabında sakla.">
      <Text style={styles.label}>E-posta</Text>
      <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" placeholder="ornek@mail.com" placeholderTextColor={COLORS.textMuted} style={styles.input} />

      <Text style={styles.label}>Şifre</Text>
      <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="En az 6 karakter" placeholderTextColor={COLORS.textMuted} style={styles.input} />

      {!!message && <Text style={styles.message}>{message}</Text>}

      {!!confirmationEmail && (
        <TouchableOpacity accessibilityRole="button" disabled={resending} style={[styles.resend, resending && styles.submitDisabled]} onPress={handleResend}>
          <Text style={styles.resendText}>{resending ? 'Tekrar gonderiliyor...' : 'Dogrulama mailini tekrar gonder'}</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity accessibilityRole="button" disabled={!canSubmit} style={[styles.submit, !canSubmit && styles.submitDisabled]} onPress={handleSubmit}>
        {submitting ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.submitText}>Hesap oluştur</Text>}
      </TouchableOpacity>

      <TouchableOpacity accessibilityRole="button" style={styles.modeButton} onPress={() => router.replace(`${authPath}?mode=login&returnTo=${encodeURIComponent(returnTo)}` as any)}>
        <Text style={styles.modeText}>Zaten hesabın var mı? Giriş yap</Text>
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
  resend: { alignItems: 'center', borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.primaryMid, paddingVertical: 12, marginBottom: 10 },
  resendText: { color: COLORS.primaryMid, fontWeight: '900' },
  modeButton: { alignItems: 'center', paddingVertical: 14 },
  modeText: { color: COLORS.primaryMid, fontWeight: '900' },
});
