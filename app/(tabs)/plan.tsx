import React from 'react';
import { Text, View } from 'react-native';
import ExamCard from '../../components/ExamCard';
import { Header, Screen } from '../../components/Screen';
import { COLORS } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { EXAMS } from '../../data/mock';

export default function PlanScreen() {
  const app = useApp();
  const planned = EXAMS.filter((exam) => app.isFavorite(exam.id) || app.hasReminder(exam.id));

  return (
    <Screen>
      <Header title="Planım" subtitle="Favorilerin ve hatırlatma eklediğin sınavlar" />
      {planned.length === 0 ? (
        <View style={{ paddingVertical: 50, alignItems: 'center' }}>
          <Text style={{ color: COLORS.textPrimary, fontSize: 17, fontWeight: '800' }}>Planın henüz boş</Text>
          <Text style={{ color: COLORS.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 20 }}>
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
