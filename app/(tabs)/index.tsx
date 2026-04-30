import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ExamCard from '../../components/ExamCard';
import SchoolCard from '../../components/SchoolCard';
import { Header, Screen } from '../../components/Screen';
import { COLORS, RADIUS, SHADOW } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { EXAMS, SCHOOLS } from '../../data/mock';

export default function HomeScreen() {
  if (Platform.OS !== 'web') {
    return <NativeHomeScreen />;
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

function NativeHomeScreen() {
  const app = useApp();
  const auth = useAuth();
  const featured = EXAMS.filter((exam) => exam.isFeatured && exam.status !== 'closed').slice(0, 2);
  const openCount = EXAMS.filter((exam) => exam.status === 'open').length;
  const verifiedCount = SCHOOLS.filter((school) => school.verified).length;

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>İzmir bursluluk takip asistanı</Text>
        <Text style={styles.heroTitle}>BursRadar</Text>
        <Text style={styles.heroText}>
          Açık başvuruları, yaklaşan sınavları ve okul kayıt dönemlerini tek yerden takip et.
        </Text>
        <View style={styles.heroActions}>
          <HomeButton label="Sınavları gör" icon="search" onPress={() => router.push('/exams')} primary />
          <HomeButton label="Okullar" icon="institution" onPress={() => router.push('/schools')} />
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatCard value={String(openCount)} label="Açık sınav" />
        <StatCard value={String(verifiedCount)} label="Doğrulanmış okul" />
        <StatCard value={String(app.favorites.length + app.reminders.length)} label="Plan öğesi" />
      </View>

      <View style={styles.accountCard}>
        <View style={styles.accountIcon}>
          <FontAwesome name={auth.user ? 'user' : 'user-o'} size={16} color={COLORS.primaryMid} />
        </View>
        <View style={styles.accountText}>
          <Text style={styles.accountTitle}>{auth.user ? 'Hesabın açık' : 'Hesap bağla'}</Text>
          <Text style={styles.accountSubtitle} numberOfLines={1}>
            {auth.user?.email ?? 'Planını ve hatırlatmalarını güvenli oturumla takip et.'}
          </Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          style={styles.accountButton}
          onPress={() => auth.user ? auth.signOut() : router.push('/auth')}
        >
          <Text style={styles.accountButtonText}>{auth.user ? 'Çıkış' : 'Giriş'}</Text>
        </TouchableOpacity>
      </View>

      <Header title="Öne çıkan sınavlar" subtitle="Başvuru tarihi yaklaşan güçlü fırsatlar" />
      {featured.map((exam) => (
        <ExamCard
          key={exam.id}
          exam={exam}
          favorite={app.isFavorite(exam.id)}
          reminder={app.hasReminder(exam.id)}
          onToggleFavorite={app.toggleFavorite}
          onToggleReminder={app.toggleReminder}
        />
      ))}

      <Header title="Doğrulanmış okullar" subtitle="Kayıt dönemi ve sınav takibi yapılabilen kurumlar" />
      {SCHOOLS.filter((school) => school.verified).slice(0, 2).map((school) => (
        <SchoolCard key={school.id} school={school} />
      ))}
    </Screen>
  );
}

function HomeButton({ label, icon, onPress, primary }: { label: string; icon: React.ComponentProps<typeof FontAwesome>['name']; onPress: () => void; primary?: boolean }) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.homeButton, primary && styles.homeButtonPrimary]}
      onPress={onPress}
    >
      <FontAwesome name={icon} size={15} color={primary ? COLORS.primary : COLORS.white} />
      <Text style={[styles.homeButtonText, primary && styles.homeButtonTextPrimary]}>{label}</Text>
    </TouchableOpacity>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
  hero: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    padding: 20,
    marginBottom: 14,
    ...SHADOW.md,
  },
  eyebrow: {
    color: '#BFDBFE',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: COLORS.white,
    fontSize: 34,
    fontWeight: '900',
    marginTop: 8,
  },
  heroText: {
    color: '#DBEAFE',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  homeButton: {
    flex: 1,
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    paddingVertical: 12,
  },
  homeButtonPrimary: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.white,
  },
  homeButtonText: {
    color: COLORS.white,
    fontWeight: '900',
    marginTop: 5,
  },
  homeButtonTextPrimary: {
    color: '#0F172A',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    color: COLORS.primaryMid,
    fontSize: 20,
    fontWeight: '900',
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 3,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: 12,
    marginBottom: 20,
    ...SHADOW.xs,
  },
  accountIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLighter,
  },
  accountText: {
    flex: 1,
  },
  accountTitle: {
    color: COLORS.textPrimary,
    fontWeight: '900',
  },
  accountSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  accountButton: {
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLighter,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  accountButtonText: {
    color: COLORS.primaryMid,
    fontWeight: '900',
    fontSize: 12,
  },
});
