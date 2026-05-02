import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Header, Screen } from '../../components/Screen';
import { COLORS, RADIUS, SHADOW } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { AuthUnavailableScreen } from './AuthScreenFrame';
import { ForgotPasswordScreen } from './ForgotPasswordScreen';
import { LoginScreen } from './LoginScreen';
import { RegisterScreen } from './RegisterScreen';

type Mode = 'login' | 'register' | 'forgot-password';

export function AccountSectionScreen() {
  const params = useLocalSearchParams<{ returnTo?: string; mode?: string }>();
  const auth = useAuth();
  const returnTo = typeof params.returnTo === 'string' && params.returnTo.startsWith('/') ? params.returnTo : '/plan';
  const mode: Mode = params.mode === 'register' || params.mode === 'forgot-password' ? params.mode : 'login';

  if (!auth.isConfigured) {
    return <AuthUnavailableScreen />;
  }

  if (auth.user) {
    return (
      <Screen>
        <Header title="Hesabım" subtitle="Oturum ve kişisel plan erişimini buradan yönet." />
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <FontAwesome name="user" size={18} color={COLORS.primaryMid} />
          </View>
          <View style={styles.accountText}>
            <Text style={styles.label}>Oturum açık</Text>
            <Text style={styles.email} numberOfLines={1}>{auth.user.email}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/plan')}>
          <Text style={styles.primaryButtonText}>Planıma git</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={auth.signOut}>
          <Text style={styles.secondaryButtonText}>Çıkış yap</Text>
        </TouchableOpacity>
      </Screen>
    );
  }

  if (mode === 'register') return <RegisterScreen returnTo={returnTo} authPath="/account" />;
  if (mode === 'forgot-password') return <ForgotPasswordScreen returnTo={returnTo} authPath="/account" />;
  return <LoginScreen returnTo={returnTo} authPath="/account" />;
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.borderLight, padding: 14, marginBottom: 14, ...SHADOW.xs },
  iconWrap: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primaryLighter },
  accountText: { flex: 1 },
  label: { color: COLORS.textMuted, fontSize: 11, fontWeight: '800' },
  email: { color: COLORS.textPrimary, fontWeight: '900', marginTop: 2 },
  primaryButton: { alignItems: 'center', borderRadius: RADIUS.md, backgroundColor: COLORS.primaryMid, paddingVertical: 14, marginBottom: 10 },
  primaryButtonText: { color: COLORS.white, fontWeight: '900' },
  secondaryButton: { alignItems: 'center', borderRadius: RADIUS.md, backgroundColor: COLORS.primaryLighter, paddingVertical: 14 },
  secondaryButtonText: { color: COLORS.primaryMid, fontWeight: '900' },
});
