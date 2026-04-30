import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ExamCard from '../../components/ExamCard';
import { Header, Screen } from '../../components/Screen';
import SelectSheet from '../../components/ui/SelectSheet';
import { COLORS, RADIUS } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { useData } from '../../context/DataContext';
import { GRADES, IZMIR_DISTRICTS } from '../../data/mock';

export default function ExamsScreen() {
  const params = useLocalSearchParams<{ district?: string; grade?: string }>();
  const [district, setDistrict] = useState(params.district ?? 'Tümü');
  const [grade, setGrade] = useState(params.grade ?? 'Tümü');
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [sheet, setSheet] = useState<'district' | 'grade' | null>(null);
  const app = useApp();
  const { exams } = useData();

  const filtered = useMemo(() => exams.filter((exam) => {
    if (district !== 'Tümü' && exam.district !== district) return false;
    if (grade !== 'Tümü' && !exam.eligibleGrades.includes(grade)) return false;
    if (onlyOpen && exam.status !== 'open') return false;
    return true;
  }).sort((a, b) => {
    if (a.status === 'closed' && b.status !== 'closed') return 1;
    if (b.status === 'closed' && a.status !== 'closed') return -1;
    return new Date(a.examDate).getTime() - new Date(b.examDate).getTime();
  }), [district, grade, onlyOpen, exams]);

  return (
    <Screen>
      <Header title="Sınavlar" subtitle={`${filtered.length} sonuç - ilçe ve sınıfa göre filtrele`} />
      <View style={styles.filters}>
        <FilterButton icon="map-marker" label="İlçe" value={district} onPress={() => setSheet('district')} />
        <FilterButton icon="graduation-cap" label="Sınıf" value={grade} onPress={() => setSheet('grade')} />
        <TouchableOpacity style={[styles.openButton, onlyOpen && styles.openButtonOn]} onPress={() => setOnlyOpen((v) => !v)}>
          <Text style={[styles.openText, onlyOpen && styles.openTextOn]}>Açık başvurular</Text>
        </TouchableOpacity>
      </View>
      {filtered.length === 0 ? (
        <Text style={styles.empty}>Bu filtrelere uygun sınav bulunamadı.</Text>
      ) : filtered.map((exam) => (
        <ExamCard
          key={exam.id}
          exam={exam}
          favorite={app.isFavorite(exam.id)}
          reminder={app.hasReminder(exam.id)}
          onToggleFavorite={app.toggleFavorite}
          onToggleReminder={app.toggleReminder}
        />
      ))}
      <SelectSheet open={sheet === 'district'} title="İlçe Seç" options={IZMIR_DISTRICTS} value={district} onSelect={setDistrict} onClose={() => setSheet(null)} />
      <SelectSheet open={sheet === 'grade'} title="Sınıf Seç" options={GRADES} value={grade} onSelect={setGrade} onClose={() => setSheet(null)} />
    </Screen>
  );
}

function FilterButton({ icon, label, value, onPress }: { icon: React.ComponentProps<typeof FontAwesome>['name']; label: string; value: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.filterButton} onPress={onPress}>
      <Text style={styles.filterLabel}><FontAwesome name={icon} size={12} /> {label}</Text>
      <Text style={styles.filterValue}>{value} <FontAwesome name="angle-down" /></Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  filters: { gap: 9, marginBottom: 14 },
  filterButton: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.borderLight, borderRadius: RADIUS.md, padding: 12 },
  filterLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700', marginBottom: 4 },
  filterValue: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '800' },
  openButton: { alignItems: 'center', borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border, paddingVertical: 10 },
  openButtonOn: { backgroundColor: COLORS.primaryLighter, borderColor: COLORS.primaryLight },
  openText: { color: COLORS.textSecondary, fontWeight: '800' },
  openTextOn: { color: COLORS.primaryMid },
  empty: { color: COLORS.textSecondary, textAlign: 'center', fontWeight: '700', paddingVertical: 28 },
});
