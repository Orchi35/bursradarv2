import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { EXAMS as MOCK_EXAMS, SCHOOLS as MOCK_SCHOOLS } from '../data/mock';
import { fetchDataFromSupabase } from '../services/dataService';
import { Exam, School } from '../types';

export type DataSource = 'mock' | 'supabase';

interface DataContextType {
  schools: School[];
  exams: Exam[];
  source: DataSource;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getSchool: (id: string) => School | undefined;
  getExam: (id: string) => Exam | undefined;
  getExamsBySchool: (schoolId: string) => Exam[];
}

const DataContext = createContext<DataContextType>({
  schools: MOCK_SCHOOLS,
  exams: MOCK_EXAMS,
  source: 'mock',
  loading: false,
  error: null,
  refresh: async () => {},
  getSchool: (id) => MOCK_SCHOOLS.find((s) => s.id === id),
  getExam: (id) => MOCK_EXAMS.find((e) => e.id === id),
  getExamsBySchool: (schoolId) => MOCK_EXAMS.filter((e) => e.schoolId === schoolId),
});

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [schools, setSchools] = useState<School[]>(MOCK_SCHOOLS);
  const [exams, setExams] = useState<Exam[]>(MOCK_EXAMS);
  const [source, setSource] = useState<DataSource>('mock');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const remote = await fetchDataFromSupabase();
      if (remote && remote.schools.length > 0) {
        setSchools(remote.schools);
        setExams(remote.exams);
        setSource('supabase');
      } else {
        setSchools(MOCK_SCHOOLS);
        setExams(MOCK_EXAMS);
        setSource('mock');
      }
    } catch (err) {
      console.warn('[DataContext] Veri yüklenemedi.', err);
      setError(err instanceof Error ? err.message : 'Veri yüklenemedi.');
      setSchools(MOCK_SCHOOLS);
      setExams(MOCK_EXAMS);
      setSource('mock');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const value = useMemo<DataContextType>(() => ({
    schools,
    exams,
    source,
    loading,
    error,
    refresh: load,
    getSchool: (id) => schools.find((s) => s.id === id),
    getExam: (id) => exams.find((e) => e.id === id),
    getExamsBySchool: (schoolId) => exams.filter((e) => e.schoolId === schoolId),
  }), [schools, exams, source, loading, error, load]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  return useContext(DataContext);
}
