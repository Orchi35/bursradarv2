import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { useData } from './DataContext';
import { supabase } from '../utils/supabaseClient';
import { cancelExamReminder, scheduleExamReminder, syncExamReminders } from '../utils/notifications';

interface AppContextType {
  favorites: string[];
  reminders: string[];
  toggleFavorite: (id: string) => void;
  toggleReminder: (id: string) => void;
  isFavorite: (id: string) => boolean;
  hasReminder: (id: string) => boolean;
}

const AppContext = createContext<AppContextType>({
  favorites: [],
  reminders: [],
  toggleFavorite: () => {},
  toggleReminder: () => {},
  isFavorite: () => false,
  hasReminder: () => false,
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const { getExam, getSchool } = useData();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [reminders, setReminders] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;

    async function loadUserPlan() {
      if (!auth.user || !supabase) {
        setFavorites([]);
        setReminders([]);
        return;
      }

      const { data, error } = await supabase
        .from('user_exam_marks')
        .select('exam_id,is_favorite,has_reminder')
        .eq('user_id', auth.user.id);

      if (!mounted) return;
      if (error) {
        console.warn('[AppContext] Plan yüklenemedi.', error);
        return;
      }

      const nextFavorites = (data ?? []).filter((row) => row.is_favorite).map((row) => row.exam_id);
      const nextReminders = (data ?? []).filter((row) => row.has_reminder).map((row) => row.exam_id);
      setFavorites(nextFavorites);
      setReminders(nextReminders);

      const reminderEntries = nextReminders.flatMap((id) => {
        const exam = getExam(id);
        if (!exam) return [];
        const school = getSchool(exam.schoolId);
        return [{ exam, schoolName: school?.name }];
      });
      syncExamReminders(reminderEntries).catch((err) => {
        console.warn('[AppContext] Hatırlatmalar senkronize edilemedi.', err);
      });
    }

    loadUserPlan();

    return () => {
      mounted = false;
    };
  }, [auth.user, getExam, getSchool]);

  const persistMark = useCallback(async (examId: string, partial: { is_favorite?: boolean; has_reminder?: boolean }) => {
    if (!auth.user || !supabase) return;

    const { data } = await supabase
      .from('user_exam_marks')
      .select('is_favorite,has_reminder')
      .eq('user_id', auth.user.id)
      .eq('exam_id', examId)
      .maybeSingle();

    const next = {
      user_id: auth.user.id,
      exam_id: examId,
      is_favorite: partial.is_favorite ?? data?.is_favorite ?? false,
      has_reminder: partial.has_reminder ?? data?.has_reminder ?? false,
    };

    if (!next.is_favorite && !next.has_reminder) {
      const { error } = await supabase
        .from('user_exam_marks')
        .delete()
        .eq('user_id', auth.user.id)
        .eq('exam_id', examId);
      if (error) console.warn('[AppContext] Plan satırı silinemedi.', error);
      return;
    }

    const { error } = await supabase.from('user_exam_marks').upsert(next, { onConflict: 'user_id,exam_id' });
    if (error) console.warn('[AppContext] Plan kaydedilemedi.', error);
  }, [auth.user]);

  const toggleFavorite = useCallback((id: string) => {
    const next = !favorites.includes(id);
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
    persistMark(id, { is_favorite: next });
  }, [favorites, persistMark]);

  const toggleReminder = useCallback((id: string) => {
    const next = !reminders.includes(id);
    setReminders(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
    persistMark(id, { has_reminder: next });

    const exam = getExam(id);
    if (next && exam) {
      const school = getSchool(exam.schoolId);
      scheduleExamReminder(exam, school?.name).then((scheduled) => {
        if (!scheduled) {
          console.warn('[AppContext] Bildirim izni verilmedi veya bu platformda desteklenmiyor.');
        }
      });
    } else {
      cancelExamReminder(id).catch((err) => {
        console.warn('[AppContext] Hatırlatma iptal edilemedi.', err);
      });
    }
  }, [reminders, persistMark, getExam, getSchool]);

  const value = useMemo(() => ({
    favorites,
    reminders,
    toggleFavorite,
    toggleReminder,
    isFavorite: (id: string) => favorites.includes(id),
    hasReminder: (id: string) => reminders.includes(id),
  }), [favorites, reminders, toggleFavorite, toggleReminder]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
