import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { COLORS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  returnTo: string;
}

export function ProtectedRoute({ children, returnTo }: ProtectedRouteProps) {
  const auth = useAuth();

  if (auth.loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primaryMid} />
          <Text style={styles.muted}>Oturum kontrol ediliyor...</Text>
        </View>
      </Screen>
    );
  }

  if (!auth.user) {
    return <Redirect href={`/account?returnTo=${encodeURIComponent(returnTo)}`} />;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: { paddingVertical: 50, alignItems: 'center' },
  muted: { color: COLORS.textSecondary, fontWeight: '700', marginTop: 10 },
});
