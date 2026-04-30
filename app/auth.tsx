import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Screen } from '../components/Screen';
import { COLORS, RADIUS, SHADOW } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

type Mode = 'signin' | 'signup';

export default function AuthScreen() {
  const params = useLocalSearchParams<{ returnTo?: string }>();
  const returnTo = typeof params.returnTo === 'string' && params.returnTo.startsWith('/') ? params.returnTo : '/';
  const auth = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const title = mode === 'signin' ? 'Giriş yap' : 'Hesap oluştur';

  const canSubmit = useMemo(() => {
    return email.trim().includes('@') && password.length >= 6 && !submitting;
  }, [email, password, submitting]);

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setMessage('');

    try {
      if (mode === 'signin') {
        await auth.signIn(email, password);
        router.replace(returnTo as any);
      } else {
        await auth.signUp(email, password);
        setMessage('Hesap oluşturuldu. Supabase email doğrulaması açıksa gelen kutunu kontrol et; kapalıysa otomatik giriş yapılır.');
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Kimlik doğrulama sırasında hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!auth.isConfigured) {
    return (
      <Screen>
        <View style={styles.card}>
          <FontAwesome name="warning" size={24} color={COLORS.warning} />
          <Text style={styles.title}>Auth yapılandırması eksik</Text>
          <Text style={styles.help}>
            `.env.local` içinde EXPO_PUBLIC_SUPABASE_URL ve EXPO_PUBLIC_SUPABASE_ANON_KEY değerlerini tanımlamalısın.
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <FontAwesome name="angle-left" size={18} color={COLORS.primaryMid} />
        <Text style={styles.backText}>Geri</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <FontAwesome name="lock" size={22} color={COLORS.white} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>
          Favorilerini ve hatırlatmalarını hesabına bağlamak için güvenli Supabase oturumu kullanıyoruz.
        </Text>

        <Text style={styles.label}>E-posta</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder="ornek@mail.com"
          placeholderTextColor={COLORS.textMuted}
          style={styles.input}
        />

        <Text style={styles.label}>Şifre</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="En az 6 karakter"
          placeholderTextColor={COLORS.textMuted}
          style={styles.input}
        />

        {!!message && <Text style={styles.message}>{message}</Text>}

        <TouchableOpacity
          accessibilityRole="button"
          disabled={!canSubmit}
          style={[styles.submit, !canSubmit && styles.submitDisabled]}
          onPress={handleSubmit}
        >
          {submitting ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.submitText}>{title}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          style={styles.modeButton}
          onPress={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin');
            setMessage('');
          }}
        >
          <Text style={styles.modeText}>
            {mode === 'signin' ? 'Hesabın yok mu? Hesap oluştur' : 'Zaten hesabın var mı? Giriş yap'}
          </Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  backText: { color: COLORS.primaryMid, fontWeight: '800' },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.borderLight, padding: 18, ...SHADOW.sm },
  iconWrap: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primaryMid, marginBottom: 12 },
  title: { color: COLORS.textPrimary, fontSize: 24, fontWeight: '900' },
  subtitle: { color: COLORS.textSecondary, lineHeight: 21, marginTop: 8, marginBottom: 18 },
  help: { color: COLORS.textSecondary, lineHeight: 21, marginTop: 10 },
  label: { color: COLORS.textPrimary, fontSize: 12, fontWeight: '900', marginBottom: 7 },
  input: { backgroundColor: COLORS.background, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.borderLight, color: COLORS.textPrimary, fontSize: 15, marginBottom: 12, paddingHorizontal: 12, paddingVertical: 12 },
  message: { color: COLORS.textSecondary, fontWeight: '700', lineHeight: 20, marginBottom: 12 },
  submit: { alignItems: 'center', borderRadius: RADIUS.md, backgroundColor: COLORS.primaryMid, paddingVertical: 14, marginTop: 2 },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: COLORS.white, fontWeight: '900' },
  modeButton: { alignItems: 'center', paddingVertical: 14 },
  modeText: { color: COLORS.primaryMid, fontWeight: '900' },
});
