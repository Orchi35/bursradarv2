import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router, Stack } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, RADIUS } from '../constants/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Sayfa Bulunamadı' }} />
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <FontAwesome name="compass" size={48} color={COLORS.textMuted} />
          <Text style={styles.title}>Sayfa bulunamadı</Text>
          <Text style={styles.subtitle}>
            Aradığın sayfa mevcut değil veya taşınmış olabilir.
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.button}
            onPress={() => router.replace('/')}
          >
            <Text style={styles.buttonText}>Ana sayfaya dön</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  title: { color: COLORS.textPrimary, fontSize: 22, fontWeight: '900', marginTop: 8 },
  subtitle: { color: COLORS.textSecondary, fontSize: 15, textAlign: 'center', lineHeight: 22 },
  button: { borderRadius: RADIUS.md, backgroundColor: COLORS.primaryMid, paddingHorizontal: 20, paddingVertical: 13, marginTop: 8 },
  buttonText: { color: COLORS.white, fontWeight: '900', fontSize: 15 },
});
