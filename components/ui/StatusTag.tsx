import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, RADIUS } from '../../constants/theme';

const MAP = {
  open: { label: 'Başvuru Açık', bg: COLORS.successLight, color: COLORS.success },
  upcoming: { label: 'Yakında', bg: COLORS.infoLight, color: COLORS.info },
  closed: { label: 'Kapandı', bg: COLORS.borderLight, color: COLORS.textMuted },
};

export default function StatusTag({ status }: { status: string }) {
  const m = MAP[status as keyof typeof MAP] ?? MAP.closed;
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
