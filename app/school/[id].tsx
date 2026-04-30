import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ExamCard from '../../components/ExamCard';
import { Screen } from '../../components/Screen';
import SchoolLogo from '../../components/ui/SchoolLogo';
import { COLORS, RADIUS } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { useData } from '../../context/DataContext';
import { formatDate, registrationStatus } from '../../utils/date';

export default function SchoolDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getSchool, getExamsBySchool } = useData();
  const school = getSchool(id);
  const app = useApp();

  if (!school) {
    return (
      <Screen>
        <Text style={styles.missing}>Okul bulunamadı.</Text>
      </Screen>
    );
  }

  const exams = getExamsBySchool(school.id);
  const reg = registrationStatus(school);

  return (
    <Screen>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <FontAwesome name="angle-left" size={18} color={COLORS.primaryMid} />
        <Text style={styles.backText}>Geri</Text>
      </TouchableOpacity>
      <View style={styles.hero}>
        <SchoolLogo school={school} size={72} />
        <View style={styles.heroText}>
          <Text style={styles.name}>{school.name}</Text>
          <Text style={styles.meta}>{school.district} - {school.city}{school.campus ? ` - ${school.campus}` : ''}</Text>
        </View>
      </View>
      {!!school.description && <Text style={styles.desc}>{school.description}</Text>}
      {reg && (
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>{reg.label}</Text>
          <Text style={styles.infoText}>
            {reg.state === 'upcoming'
              ? `${formatDate(school.registrationStartDate!)} tarihinde başlayacak`
              : reg.state === 'open'
                ? `Son kayıt: ${formatDate(school.registrationDeadline!)}`
                : `${formatDate(school.registrationDeadline!)} tarihinde kapandı`}
          </Text>
        </View>
      )}
      <View style={styles.contact}>
        {!!school.phone && (
          <ContactLink icon="phone" label={school.phone} url={`tel:${school.phone.replace(/\s+/g, '')}`} />
        )}
        {!!school.website && (
          <ContactLink icon="globe" label={school.website} url={normalizeWebsiteUrl(school.website)} />
        )}
        {!!school.instagram && (
          <ContactLink icon="instagram" label={school.instagram} url={normalizeInstagramUrl(school.instagram)} />
        )}
      </View>
      <Text style={styles.sectionTitle}>Sınavlar</Text>
      {exams.length === 0 ? (
        <Text style={styles.empty}>Bu okul için takip edilen sınav bulunmuyor.</Text>
      ) : exams.map((exam) => (
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

function ContactLink({ icon, label, url }: { icon: React.ComponentProps<typeof FontAwesome>['name']; label: string; url: string }) {
  async function openLink() {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  }

  return (
    <TouchableOpacity accessibilityRole="link" style={styles.contactLink} onPress={openLink}>
      <FontAwesome name={icon} color={COLORS.primaryMid} size={15} />
      <Text style={styles.contactText}>{label}</Text>
      <FontAwesome name="external-link" color={COLORS.textMuted} size={12} />
    </TouchableOpacity>
  );
}

function normalizeWebsiteUrl(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function normalizeInstagramUrl(handle: string) {
  if (/^https?:\/\//i.test(handle)) return handle;
  return `https://www.instagram.com/${handle.replace(/^@/, '')}`;
}

const styles = StyleSheet.create({
  missing: { color: COLORS.textPrimary, fontWeight: '800' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  backText: { color: COLORS.primaryMid, fontWeight: '800' },
  hero: { flexDirection: 'row', gap: 14, alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 16, borderWidth: 1, borderColor: COLORS.borderLight },
  heroText: { flex: 1 },
  name: { color: COLORS.textPrimary, fontSize: 22, fontWeight: '900', lineHeight: 28 },
  meta: { color: COLORS.textSecondary, marginTop: 6, lineHeight: 19 },
  desc: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 21, marginTop: 14 },
  infoCard: { backgroundColor: COLORS.successLight, borderRadius: RADIUS.lg, padding: 14, marginTop: 14 },
  infoTitle: { color: COLORS.success, fontWeight: '900', fontSize: 16 },
  infoText: { color: COLORS.textSecondary, marginTop: 4 },
  contact: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 10, gap: 6, marginTop: 14, borderWidth: 1, borderColor: COLORS.borderLight },
  contactLink: { flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: RADIUS.md, paddingHorizontal: 8, paddingVertical: 9 },
  contactText: { color: COLORS.textPrimary, fontWeight: '700', flex: 1 },
  sectionTitle: { color: COLORS.textPrimary, fontSize: 19, fontWeight: '900', marginTop: 22, marginBottom: 12 },
  empty: { color: COLORS.textSecondary, textAlign: 'center', fontWeight: '700', paddingVertical: 20 },
});
