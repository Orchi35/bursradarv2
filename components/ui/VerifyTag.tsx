import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, RADIUS } from '../../constants/theme';

const MAP = {
  verified: { label: 'Doğrulandı', bg: COLORS.successLight, color: COLORS.success },
  pending: { label: 'Kontrol Bekliyor', bg: COLORS.warningLight, color: '#B45309' },
  outdated: { label: 'Eski Olabilir', bg: COLORS.errorLight, color: COLORS.error },
};

export default function VerifyTag({ status }: { status: string }) {
  const m = MAP[status as keyof typeof MAP] ?? MAP.pending;
  return (
    <View style={[s.tag, { backgroundColor: m.bg }]}>
      <View style={[s.dot, { backgroundColor: m.color }]} />
      <Text style={[s.label, { color: m.color }]}>{m.label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { fontSize: 10.5, fontWeight: '600' },
});
