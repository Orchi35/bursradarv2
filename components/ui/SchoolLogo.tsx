import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { schoolInitials } from '../../utils/format';
import { School } from '../../types';

export default function SchoolLogo({ school, size = 42 }: { school: School; size?: number }) {
  const initials = schoolInitials(school.name);
  const fs = size >= 60 ? 18 : 13;
  return (
    <View style={[s.logo, { width: size, height: size, borderRadius: size * 0.26, backgroundColor: school.logoColor + '1f' }]}>
      <Text style={[s.text, { color: school.logoColor, fontSize: fs }]}>{initials}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  logo: { alignItems: 'center', justifyContent: 'center' },
  text: { fontWeight: '700' },
});
