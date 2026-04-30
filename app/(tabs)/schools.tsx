import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import SchoolCard from '../../components/SchoolCard';
import { Header, Screen } from '../../components/Screen';
import { COLORS, RADIUS } from '../../constants/theme';
import { SCHOOLS } from '../../data/mock';

export default function SchoolsScreen() {
  const [query, setQuery] = useState('');
  const schools = useMemo(() => SCHOOLS.filter((school) => {
    const q = query.toLocaleLowerCase('tr-TR').trim();
    if (!q) return true;
    return `${school.name} ${school.district}`.toLocaleLowerCase('tr-TR').includes(q);
  }), [query]);

  return (
    <Screen>
      <Header title="Okullar" subtitle={`${schools.length} okul - doğrulama ve kayıt durumları`} />
      <View style={styles.searchBox}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Okul veya ilçe ara"
          placeholderTextColor={COLORS.textMuted}
          style={styles.input}
        />
      </View>
      {schools.length === 0 ? (
        <Text style={styles.empty}>Bu aramaya uygun okul bulunamadı.</Text>
      ) : schools.map((school) => <SchoolCard key={school.id} school={school} />)}
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchBox: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.borderLight, paddingHorizontal: 12, marginBottom: 14 },
  input: { color: COLORS.textPrimary, fontSize: 15, paddingVertical: 12 },
  empty: { color: COLORS.textSecondary, textAlign: 'center', fontWeight: '700', paddingVertical: 28 },
});
