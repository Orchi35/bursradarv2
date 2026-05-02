import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { COLORS, RADIUS, SHADOW } from '../../constants/theme';

interface AuthScreenFrameProps {
  children: React.ReactNode;
  icon?: React.ComponentProps<typeof FontAwesome>['name'];
  title: string;
  subtitle: string;
}

export function AuthScreenFrame({ children, icon = 'lock', title, subtitle }: AuthScreenFrameProps) {
  return (
    <Screen>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <FontAwesome name="angle-left" size={18} color={COLORS.primaryMid} />
        <Text style={styles.backText}>Geri</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <FontAwesome name={icon} size={22} color={COLORS.white} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        {children}
      </View>
    </Screen>
  );
}

export function AuthUnavailableScreen() {
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

const styles = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  backText: { color: COLORS.primaryMid, fontWeight: '800' },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.borderLight, padding: 18, ...SHADOW.sm },
  iconWrap: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primaryMid, marginBottom: 12 },
  title: { color: COLORS.textPrimary, fontSize: 24, fontWeight: '900' },
  subtitle: { color: COLORS.textSecondary, lineHeight: 21, marginTop: 8, marginBottom: 18 },
  help: { color: COLORS.textSecondary, lineHeight: 21, marginTop: 10 },
});
