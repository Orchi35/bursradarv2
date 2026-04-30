import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getExam, getSchool } from '../data/mock';
import { Exam } from '../types';
import { formatLongDate } from './date';

const STORAGE_PREFIX = 'bursradar:exam-reminder:';
const DAY_MS = 24 * 60 * 60 * 1000;
let notificationHandlerReady = false;
type ExpoNotifications = typeof import('expo-notifications');

export async function scheduleExamReminder(examId: string): Promise<boolean> {
  const exam = getExam(examId);
  if (!exam) return false;

  await cancelExamReminder(examId);

  if (Platform.OS === 'web') {
    return scheduleWebReminder(exam);
  }

  const Notifications = await getNotifications();
  const granted = await ensureNotificationPermission(Notifications);
  if (!granted) return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('exam-reminders', {
      name: 'Sınav hatırlatmaları',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  const triggerDate = getReminderDate(exam);
  const school = getSchool(exam.schoolId);
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'BursRadar hatırlatma',
      body: `${school?.name ?? 'Okul'}: ${exam.examName} için tarih yaklaşıyor. Son başvuru: ${formatLongDate(exam.applicationDeadline)}.`,
      data: { examId },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
      channelId: Platform.OS === 'android' ? 'exam-reminders' : undefined,
    },
  });

  await AsyncStorage.setItem(storageKey(examId), id);
  return true;
}

export async function cancelExamReminder(examId: string) {
  const key = storageKey(examId);
  const existingId = await AsyncStorage.getItem(key);
  if (existingId && Platform.OS !== 'web') {
    const Notifications = await getNotifications();
    await Notifications.cancelScheduledNotificationAsync(existingId);
  }
  await AsyncStorage.removeItem(key);
}

export async function syncExamReminders(examIds: string[]) {
  await Promise.all(examIds.map((id) => scheduleExamReminder(id)));
}

async function getNotifications(): Promise<ExpoNotifications> {
  const Notifications = await import('expo-notifications');
  if (!notificationHandlerReady) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    notificationHandlerReady = true;
  }
  return Notifications;
}

async function ensureNotificationPermission(Notifications: ExpoNotifications) {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const next = await Notifications.requestPermissionsAsync();
  return next.granted;
}

function getReminderDate(exam: Exam) {
  const now = Date.now();
  const deadlineReminder = parseLocalDate(exam.applicationDeadline).getTime() - DAY_MS;
  if (deadlineReminder > now) return new Date(deadlineReminder);

  const examReminder = parseLocalDate(exam.examDate).getTime() - DAY_MS;
  if (examReminder > now) return new Date(examReminder);

  return new Date(now + 60_000);
}

function parseLocalDate(iso: string) {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return new Date(iso);
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 9, 0, 0);
}

function storageKey(examId: string) {
  return `${STORAGE_PREFIX}${examId}`;
}

async function scheduleWebReminder(exam: Exam) {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;

  if (Notification.permission === 'default') {
    await Notification.requestPermission();
  }
  if (Notification.permission !== 'granted') return false;

  await AsyncStorage.setItem(storageKey(exam.id), `web:${getReminderDate(exam).toISOString()}`);
  return true;
}
