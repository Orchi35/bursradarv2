import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Screen } from '../../components/Screen';
import SchoolLogo from '../../components/ui/SchoolLogo';
import ScoreBadge from '../../components/ui/ScoreBadge';
import StatusTag from '../../components/ui/StatusTag';
import VerifyTag from '../../components/ui/VerifyTag';
import { COLORS, RADIUS, SHADOW } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { getExam, getSchool } from '../../data/mock';
import { daysUntilLabel, formatLongDate } from '../../utils/date';

export default function ExamDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const exam = getExam(id);
  const app = useApp();

  if (!exam) {
    return (
      <Screen>
        <Text style={styles.missing}>Sınav bulunamadı.</Text>
      </Screen>
    );
  }

  const school = getSchool(exam.schoolId);

  return (
    <Screen>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <FontAwesome name="angle-left" size={18} color={COLORS.primaryMid} />
        <Text style={styles.backText}>Geri</Text>
      </TouchableOpacity>
      <View style={styles.card}>
        <View style={styles.head}>
          {school && <SchoolLogo school={school} size={58} />}
          <View style={styles.headText}>
            <Text style={styles.school}>{school?.name}</Text>
            <Text style={styles.meta}>{exam.district} - {exam.city}</Text>
          </View>
          <ScoreBadge score={exam.scholarshipScore} size="md" />
        </View>
        <Text style={styles.title}>{exam.examName}</Text>
        <View style={styles.tags}>
          <StatusTag status={exam.status} />
          <VerifyTag status={exam.verificationStatus} />
        </View>
      </View>

      <View style={styles.grid}>
        <Info label="Sınav Tarihi" value={formatLongDate(exam.examDate)} />
        <Info label="Son Başvuru" value={formatLongDate(exam.applicationDeadline)} />
        <Info label="Süre" value={exam.status === 'closed' ? 'Bitti' : daysUntilLabel(exam.examDate)} />
        <Info label="Kaynak" value={sourceLabel(exam.sourceType)} />
      </View>

      {!!exam.examLocation && <InfoBlock title="Sınav Yeri" text={exam.examLocation} />}
      {!!exam.notes && <InfoBlock title="Notlar" text={exam.notes} />}

      <View style={styles.grades}>
        <Text style={styles.blockTitle}>Uygun Sınıflar</Text>
        <View style={styles.gradeRow}>
          {exam.eligibleGrades.map((grade) => <Text key={grade} style={styles.grade}>{grade}</Text>)}
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.action, app.isFavorite(exam.id) && styles.actionOn]} onPress={() => app.toggleFavorite(exam.id)}>
          <FontAwesome name="heart" size={15} color={app.isFavorite(exam.id) ? COLORS.primaryMid : COLORS.textSecondary} />
          <Text style={[styles.actionText, app.isFavorite(exam.id) && styles.actionTextOn]}>{app.isFavorite(exam.id) ? 'Favoride' : 'Favori'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.action, app.hasReminder(exam.id) && styles.actionOn]} onPress={() => app.toggleReminder(exam.id)}>
          <FontAwesome name="bell" size={15} color={app.hasReminder(exam.id) ? COLORS.primaryMid : COLORS.textSecondary} />
          <Text style={[styles.actionText, app.hasReminder(exam.id) && styles.actionTextOn]}>{app.hasReminder(exam.id) ? 'Hatırlatma açık' : 'Hatırlat'}</Text>
        </TouchableOpacity>
      </View>

      {!!exam.applicationUrl && (
        <TouchableOpacity
          accessibilityRole="link"
          style={styles.applyButton}
          onPress={() => Linking.openURL(normalizeUrl(exam.applicationUrl!))}
        >
          <FontAwesome name="external-link" size={15} color={COLORS.white} />
          <Text style={styles.applyText}>Başvuru sayfasını aç</Text>
        </TouchableOpacity>
      )}
    </Screen>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.info}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function InfoBlock({ title, text }: { title: string; text: string }) {
  return (
    <View style={styles.block}>
      <Text style={styles.blockTitle}>{title}</Text>
      <Text style={styles.blockText}>{text}</Text>
    </View>
  );
}

const SOURCE_LABELS: Record<string, string> = {
  official_website: 'Resmi web sitesi',
  social_media: 'Sosyal medya',
  instagram: 'Instagram',
  facebook: 'Facebook',
  twitter: 'X / Twitter',
  phone: 'Telefon',
  email: 'E-posta',
  manual: 'Manuel girdi',
};

function sourceLabel(source: string) {
  return SOURCE_LABELS[source] ?? source;
}

function normalizeUrl(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

const styles = StyleSheet.create({
  missing: { color: COLORS.textPrimary, fontWeight: '800' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  backText: { color: COLORS.primaryMid, fontWeight: '800' },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 16, borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headText: { flex: 1 },
  school: { color: COLORS.textPrimary, fontWeight: '900', fontSize: 16 },
  meta: { color: COLORS.textSecondary, marginTop: 4 },
  title: { color: COLORS.textPrimary, fontSize: 24, lineHeight: 30, fontWeight: '900', marginTop: 18 },
  tags: { flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap' },
  grid: { gap: 10, marginTop: 14 },
  info: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.borderLight, padding: 13 },
  infoLabel: { color: COLORS.textMuted, fontSize: 12, fontWeight: '800' },
  infoValue: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '800', marginTop: 5, lineHeight: 21 },
  block: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.borderLight, padding: 13, marginTop: 12 },
  blockTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '900' },
  blockText: { color: COLORS.textSecondary, lineHeight: 20, marginTop: 6 },
  grades: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.borderLight, padding: 13, marginTop: 12 },
  gradeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 10 },
  grade: { overflow: 'hidden', borderRadius: RADIUS.full, backgroundColor: COLORS.primaryLighter, color: COLORS.primaryMid, fontSize: 12, fontWeight: '800', paddingHorizontal: 10, paddingVertical: 6 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  action: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, borderRadius: RADIUS.md, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.borderLight, paddingVertical: 13 },
  actionOn: { backgroundColor: COLORS.primaryLighter, borderColor: COLORS.primaryLight },
  actionText: { color: COLORS.textSecondary, fontWeight: '900' },
  actionTextOn: { color: COLORS.primaryMid },
  applyButton: { marginTop: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, borderRadius: RADIUS.md, backgroundColor: COLORS.primaryMid, paddingVertical: 14 },
  applyText: { color: COLORS.white, fontWeight: '900' },
});
