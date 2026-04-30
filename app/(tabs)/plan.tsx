import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ExamCard from '../../components/ExamCard';
import { Header, Screen } from '../../components/Screen';
import { COLORS, RADIUS } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { EXAMS } from '../../data/mock';

export default function PlanScreen() {
  const app = useApp();
  const auth = useAuth();
  const planned = EXAMS.filter((exam) => app.isFavorite(exam.id) || app.hasReminder(exam.id));

  if (auth.loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primaryMid} />
          <Text style={styles.muted}>Oturum kontrol ediliyor...</Text>
        </View>
      </Screen>
    );
  }

  if (!auth.user) {
    return (
      <Screen>
        <Header title="Planım" subtitle="Favorilerini ve hatırlatmalarını hesabına bağla" />
        <View style={styles.authCard}>
          <FontAwesome name="lock" size={22} color={COLORS.primaryMid} />
          <Text style={styles.authTitle}>Planını görmek için giriş yap</Text>
          <Text style={styles.authText}>
            BursRadar planı kişisel bir alan olduğu için giriş yaptıktan sonra favori ve hatırlatmalarını yönetebilirsin.
          </Text>
          <TouchableOpacity style={styles.authButton} onPress={() => router.push('/auth?returnTo=/plan')}>
            <Text style={styles.authButtonText}>Giriş yap veya hesap oluştur</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title="Planım" subtitle="Favorilerin ve hatırlatma eklediğin sınavlar" />
      <View style={styles.accountRow}>
        <View style={styles.accountText}>
          <Text style={styles.accountLabel}>Oturum açık</Text>
          <Text style={styles.accountEmail} numberOfLines={1}>{auth.user.email}</Text>
        </View>
        <TouchableOpacity style={styles.signOutButton} onPress={auth.signOut}>
          <Text style={styles.signOutText}>Çıkış</Text>
        </TouchableOpacity>
      </View>
      {planned.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Planın henüz boş</Text>
          <Text style={styles.emptyText}>
            Sınav kartlarından favori veya hatırlatma eklediğinde burada görünecek.
          </Text>
        </View>
      ) : planned.map((exam) => (
        <ExamCard
          key={exam.id}
          exam={exam}
          favorite={app.isFavorite(exam.id)}
          reminder={app.hasReminder(exam.id)}
          onToggleFavorite={app.toggleFavorite}
          onToggleReminder={app.toggleReminder}
        />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { paddingVertical: 50, alignItems: 'center' },
  muted: { color: COLORS.textSecondary, fontWeight: '700', marginTop: 10 },
  authCard: { alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.borderLight, padding: 18 },
  authTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '900', marginTop: 12, textAlign: 'center' },
  authText: { color: COLORS.textSecondary, textAlign: 'center', lineHeight: 21, marginTop: 8 },
  authButton: { borderRadius: RADIUS.md, backgroundColor: COLORS.primaryMid, paddingHorizontal: 14, paddingVertical: 12, marginTop: 16 },
  authButtonText: { color: COLORS.white, fontWeight: '900' },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.borderLight, padding: 12, marginBottom: 14 },
  accountText: { flex: 1 },
  accountLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '800' },
  accountEmail: { color: COLORS.textPrimary, fontWeight: '900', marginTop: 2 },
  signOutButton: { borderRadius: RADIUS.full, backgroundColor: COLORS.primaryLighter, paddingHorizontal: 12, paddingVertical: 8 },
  signOutText: { color: COLORS.primaryMid, fontWeight: '900', fontSize: 12 },
  emptyTitle: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '800' },
  emptyText: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 20 },
});
