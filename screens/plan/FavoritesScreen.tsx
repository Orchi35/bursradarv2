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

interface FavoritesScreenProps {
  exams: Exam[];
  emptyStyles: EmptyStyles;
}

export function FavoritesScreen({ exams, emptyStyles }: FavoritesScreenProps) {
  const app = useApp();
  const favorites = exams.filter((exam) => app.isFavorite(exam.id));

  if (favorites.length === 0) {
    return (
      <View style={emptyStyles.center}>
        <Text style={emptyStyles.title}>Favori sınavın yok</Text>
        <Text style={emptyStyles.text}>Sınav kartlarından favori eklediğinde burada görünecek.</Text>
      </View>
    );
  }

  return favorites.map((exam) => (
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
