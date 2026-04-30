import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, RADIUS, SHADOW } from '../constants/theme';
import { useData } from '../context/DataContext';
import { School } from '../types';
import { formatDate, registrationStatus } from '../utils/date';
import SchoolLogo from './ui/SchoolLogo';

export default function SchoolCard({ school }: { school: School }) {
  const { getExamsBySchool } = useData();
  const exams = getExamsBySchool(school.id);
  const open = exams.filter((exam) => exam.status === 'open').length;
  const reg = registrationStatus(school);

  return (
    <TouchableOpacity activeOpacity={0.9} style={styles.card} onPress={() => router.push(`/school/${school.id}`)}>
      <View style={styles.head}>
        <SchoolLogo school={school} size={46} />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{school.name}</Text>
          <Text style={styles.meta}><FontAwesome name="map-marker" size={11} /> {school.district} - İzmir</Text>
        </View>
        {school.verified && (
          <View style={styles.verified}>
            <FontAwesome name="check" color={COLORS.white} size={11} />
          </View>
        )}
      </View>
      {!!school.description && <Text style={styles.desc} numberOfLines={2}>{school.description}</Text>}
      {reg && school.registrationDeadline && (
        <View style={[styles.reg, styles[`reg_${reg.state}`]]}>
          <View style={[styles.regDot, styles[`regDot_${reg.state}`]]} />
          <Text style={[styles.regText, styles[`regText_${reg.state}`]]}>{reg.label}</Text>
          <Text style={styles.regDate}>
            {reg.state === 'upcoming'
              ? `${formatDate(school.registrationStartDate!)} başlıyor`
              : reg.state === 'open'
                ? `Son ${formatDate(school.registrationDeadline)}`
                : `${formatDate(school.registrationDeadline)} bitti`}
          </Text>
        </View>
      )}
      <View style={styles.stats}>
        <Stat n={String(exams.length)} label="Sınav" />
        <Stat n={String(open)} label="Açık" green={open > 0} />
        <Stat n={school.verified ? 'Evet' : 'Hayır'} label="Doğrulu" />
      </View>
    </TouchableOpacity>
  );
}

function Stat({ n, label, green }: { n: string; label: string; green?: boolean }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statNum, green && styles.green]}>{n}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.borderLight, padding: 14, marginBottom: 10, ...SHADOW.sm },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  info: { flex: 1 },
  name: { color: COLORS.textPrimary, fontWeight: '700', fontSize: 15, lineHeight: 20 },
  meta: { color: COLORS.textMuted, fontSize: 11.5, marginTop: 3 },
  verified: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.success },
  desc: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 10 },
  reg: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: RADIUS.md, paddingHorizontal: 10, paddingVertical: 7, marginTop: 10, borderWidth: 1, borderColor: 'transparent' },
  reg_open: { backgroundColor: COLORS.successLight, borderColor: 'rgba(16,185,129,0.14)' },
  reg_upcoming: { backgroundColor: COLORS.warningLight, borderColor: 'rgba(245,158,11,0.14)' },
  reg_closed: { backgroundColor: COLORS.borderLight, borderColor: COLORS.border },
  regDot: { width: 6, height: 6, borderRadius: 3 },
  regDot_open: { backgroundColor: COLORS.success },
  regDot_upcoming: { backgroundColor: COLORS.warning },
  regDot_closed: { backgroundColor: COLORS.textMuted },
  regText: { fontSize: 11.5, fontWeight: '800' },
  regText_open: { color: COLORS.success },
  regText_upcoming: { color: '#B45309' },
  regText_closed: { color: COLORS.textMuted },
  regDate: { marginLeft: 'auto', color: COLORS.textSecondary, fontSize: 11.5, fontWeight: '700' },
  stats: { flexDirection: 'row', backgroundColor: COLORS.background, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.borderLight, marginTop: 12, paddingVertical: 8 },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '800' },
  green: { color: COLORS.success },
  statLabel: { color: COLORS.textMuted, fontSize: 10, marginTop: 1 },
});
