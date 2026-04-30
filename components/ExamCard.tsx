import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, RADIUS, SHADOW } from '../constants/theme';
import { getSchool } from '../data/mock';
import { Exam } from '../types';
import { daysUntilLabel, formatDate, urgency } from '../utils/date';
import SchoolLogo from './ui/SchoolLogo';
import ScoreBadge from './ui/ScoreBadge';
import StatusTag from './ui/StatusTag';
import VerifyTag from './ui/VerifyTag';

interface Props {
  exam: Exam;
  compact?: boolean;
  favorite?: boolean;
  reminder?: boolean;
  onToggleFavorite?: (id: string) => void;
  onToggleReminder?: (id: string) => void;
}

export default function ExamCard({ exam, compact, favorite, reminder, onToggleFavorite, onToggleReminder }: Props) {
  const school = getSchool(exam.schoolId);
  const closed = exam.status === 'closed';
  const deadlineUrgency = urgency(exam.applicationDeadline);

  if (!school) return null;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={[styles.card, compact && styles.compactCard, closed && styles.closedCard]}
      onPress={() => router.push(`/exam/${exam.id}`)}
    >
      <View style={styles.head}>
        <SchoolLogo school={school} />
        <View style={styles.headText}>
          <Text style={styles.school} numberOfLines={1}>{school.name}</Text>
          <Text style={styles.meta}><FontAwesome name="map-marker" size={11} /> {exam.district}</Text>
        </View>
        <ScoreBadge score={exam.scholarshipScore} />
      </View>

      <Text style={styles.examName} numberOfLines={compact ? 2 : 3}>{exam.examName}</Text>

      {!compact && (
        <View style={styles.dates}>
          <DateItem label="Sınav" value={formatDate(exam.examDate)} />
          <DateItem label="Son Başvuru" value={formatDate(exam.applicationDeadline)} urgent={deadlineUrgency === 'urgent' || deadlineUrgency === 'soon'} />
          <DateItem label="Süre" value={closed ? 'Bitti' : daysUntilLabel(exam.examDate)} urgent={deadlineUrgency === 'urgent'} />
        </View>
      )}

      <View style={styles.gradeRow}>
        {exam.eligibleGrades.slice(0, compact ? 3 : 4).map((grade) => (
          <Text key={grade} style={styles.grade}>{grade}</Text>
        ))}
        {exam.eligibleGrades.length > (compact ? 3 : 4) && (
          <Text style={styles.grade}>+{exam.eligibleGrades.length - (compact ? 3 : 4)}</Text>
        )}
      </View>

      <View style={styles.tags}>
        <StatusTag status={exam.status} />
        <VerifyTag status={exam.verificationStatus} />
      </View>

      {!compact && (
        <View style={styles.actions}>
          <Action icon="heart" label={favorite ? 'Favoride' : 'Favori'} active={favorite} onPress={() => onToggleFavorite?.(exam.id)} />
          <Action icon="bell" label={reminder ? 'Hatırlatma' : 'Hatırlat'} active={reminder} onPress={() => onToggleReminder?.(exam.id)} />
          <View style={styles.detail}>
            <Text style={styles.detailText}>Detay</Text>
            <FontAwesome name="angle-right" color={COLORS.primaryMid} size={16} />
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

function DateItem({ label, value, urgent }: { label: string; value: string; urgent?: boolean }) {
  return (
    <View style={styles.dateItem}>
      <Text style={styles.dateLabel}>{label}</Text>
      <Text style={[styles.dateValue, urgent && styles.urgent]}>{value}</Text>
    </View>
  );
}

function Action({ icon, label, active, onPress }: { icon: React.ComponentProps<typeof FontAwesome>['name']; label: string; active?: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.action, active && styles.actionOn]} onPress={onPress}>
      <FontAwesome name={icon} size={13} color={active ? COLORS.primaryMid : COLORS.textSecondary} />
      <Text style={[styles.actionText, active && styles.actionTextOn]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  compactCard: { width: 280 },
  closedCard: { opacity: 0.62 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headText: { flex: 1 },
  school: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '700' },
  meta: { marginTop: 3, color: COLORS.textMuted, fontSize: 11.5 },
  examName: { marginTop: 12, color: COLORS.textPrimary, fontSize: 16, fontWeight: '800', lineHeight: 22 },
  dates: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, paddingVertical: 12, borderRadius: RADIUS.md, backgroundColor: COLORS.background },
  dateItem: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  dateLabel: { color: COLORS.textMuted, fontSize: 11, marginBottom: 4 },
  dateValue: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '700' },
  urgent: { color: COLORS.error },
  gradeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 13 },
  grade: { overflow: 'hidden', borderRadius: RADIUS.full, backgroundColor: COLORS.primaryLighter, color: COLORS.primaryMid, fontSize: 11, fontWeight: '700', paddingHorizontal: 9, paddingVertical: 5 },
  tags: { flexDirection: 'row', gap: 7, marginTop: 12, flexWrap: 'wrap' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.background, borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 8 },
  actionOn: { backgroundColor: COLORS.primaryLighter },
  actionText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '700' },
  actionTextOn: { color: COLORS.primaryMid },
  detail: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 5 },
  detailText: { color: COLORS.primaryMid, fontWeight: '800', fontSize: 13 },
});
