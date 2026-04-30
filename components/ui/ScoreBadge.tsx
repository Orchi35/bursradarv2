import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  score: number;
  size?: 'sm' | 'md';
}

function color(score: number) {
  if (score >= 80) return '#10B981';
  if (score >= 60) return '#F59E0B';
  return '#EF4444';
}

export default function ScoreBadge({ score, size = 'sm' }: Props) {
  const c = color(score);
  const outer = size === 'sm' ? 38 : 50;
  const inner = size === 'sm' ? 28 : 38;
  const fs = size === 'sm' ? 12 : 15;

  return (
    <View style={[s.outer, { width: outer, height: outer, borderRadius: outer / 2, borderColor: c + '30' }]}>
      <View style={[s.ring, { width: outer, height: outer, borderRadius: outer / 2, borderColor: c }]} />
      <View style={[s.inner, { width: inner, height: inner, borderRadius: inner / 2 }]}>
        <Text style={[s.score, { color: c, fontSize: fs }]}>{score}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  outer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  ring: {
    position: 'absolute',
    borderWidth: 2.5,
    backgroundColor: 'transparent',
  },
  inner: {
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  score: {
    fontWeight: '700',
    lineHeight: 18,
  },
});
