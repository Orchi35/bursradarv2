import React from 'react';
import { Text, View } from 'react-native';
import ExamCard from '../../components/ExamCard';
import { useApp } from '../../context/AppContext';
import type { Exam } from '../../types';

interface EmptyStyles {
  center: object;
  title: object;
  text: object;
}

interface RemindersScreenProps {
  exams: Exam[];
  emptyStyles: EmptyStyles;
}

export function RemindersScreen({ exams, emptyStyles }: RemindersScreenProps) {
  const app = useApp();
  const reminders = exams.filter((exam) => app.hasReminder(exam.id));

  if (reminders.length === 0) {
    return (
      <View style={emptyStyles.center}>
        <Text style={emptyStyles.title}>Hatırlatman yok</Text>
        <Text style={emptyStyles.text}>Sınav kartlarından hatırlatma eklediğinde burada görünecek.</Text>
      </View>
    );
  }

  return reminders.map((exam) => (
    <ExamCard
      key={exam.id}
      exam={exam}
      favorite={app.isFavorite(exam.id)}
      reminder={app.hasReminder(exam.id)}
      onToggleFavorite={app.toggleFavorite}
      onToggleReminder={app.toggleReminder}
    />
  ));
}
