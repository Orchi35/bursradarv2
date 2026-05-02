import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ExamCard from '../../components/ExamCard';
import { Header, Screen } from '../../components/Screen';
import { COLORS, RADIUS } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { FavoritesScreen } from './FavoritesScreen';
import { RemindersScreen } from './RemindersScreen';

type PlanView = 'all' | 'favorites' | 'reminders';

export function MyPlanScreen() {
  const app = useApp();
  const auth = useAuth();
  const { exams } = useData();
  const [view, setView] = useState<PlanView>('all');
  const planned = useMemo(() => exams.filter((exam) => app.isFavorite(exam.id) || app.hasReminder(exam.id)), [app, exams]);

  return (
    <Screen>
      <Header title="Planım" subtitle="Favorilerin ve hatırlatma eklediğin sınavlar" />
      <View style={styles.accountRow}>
        <View style={styles.accountText}>
          <Text style={styles.accountLabel}>Oturum açık</Text>
          <Text style={styles.accountEmail} numberOfLines={1}>{auth.user?.email}</Text>
        </View>
        <TouchableOpacity style={styles.signOutButton} onPress={auth.signOut}>
          <Text style={styles.signOutText}>Çıkış</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.segment}>
        <SegmentButton label="Tüm plan" active={view === 'all'} onPress={() => setView('all')} />
        <SegmentButton label="Favoriler" active={view === 'favorites'} onPress={() => setView('favorites')} />
        <SegmentButton label="Hatırlatmalar" active={view === 'reminders'} onPress={() => setView('reminders')} />
      </View>

      {view === 'favorites' ? (
        <FavoritesScreen exams={exams} emptyStyles={emptyStyles} />
      ) : view === 'reminders' ? (
        <RemindersScreen exams={exams} emptyStyles={emptyStyles} />
      ) : planned.length === 0 ? (
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

function SegmentButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.segmentButton, active && styles.segmentButtonActive]} onPress={onPress}>
      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  center: { paddingVertical: 50, alignItems: 'center' },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.borderLight, padding: 12, marginBottom: 14 },
  accountText: { flex: 1 },
  accountLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '800' },
  accountEmail: { color: COLORS.textPrimary, fontWeight: '900', marginTop: 2 },
  signOutButton: { borderRadius: RADIUS.full, backgroundColor: COLORS.primaryLighter, paddingHorizontal: 12, paddingVertical: 8 },
  signOutText: { color: COLORS.primaryMid, fontWeight: '900', fontSize: 12 },
  segment: { flexDirection: 'row', backgroundColor: COLORS.borderLight, borderRadius: RADIUS.md, padding: 3, marginBottom: 14 },
  segmentButton: { flex: 1, alignItems: 'center', borderRadius: RADIUS.sm, paddingVertical: 9 },
  segmentButtonActive: { backgroundColor: COLORS.surface },
  segmentText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '800' },
  segmentTextActive: { color: COLORS.primaryMid },
  emptyTitle: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '800' },
  emptyText: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 20 },
});

const emptyStyles = {
  center: styles.center,
  title: styles.emptyTitle,
  text: styles.emptyText,
};
