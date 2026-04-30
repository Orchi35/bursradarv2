import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

export default function BursRadarDesignScreen() {
  if (Platform.OS !== 'web') {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>
          BursRadar tasarım prototipi web görünümünde birebir çalışır.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {React.createElement('iframe', {
        src: '/bursradar/BursRadar.html',
        title: 'BursRadar',
        style: styles.iframe,
        frameBorder: 0,
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1f2937',
  },
  iframe: {
    width: '100%',
    height: '100%',
    borderWidth: 0,
    borderStyle: 'none',
  } as any,
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  fallbackText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});
