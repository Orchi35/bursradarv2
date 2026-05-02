import { Exam, School } from '../types';
import { isSupabaseConfigured, selectRows } from '../utils/supabaseClient';

const FALLBACK_LOGO_COLORS = ['#1A3A6B', '#0EA5E9', '#2563EB', '#7C3AED', '#0F766E', '#16A34A', '#DC2626', '#EA580C'];

interface SupabaseSchool {
  id: string;
  name: string;
  campus_name: string | null;
  city: string;
  district: string;
  is_verified: boolean;
  is_premium: boolean;
  about_text: string | null;
  registration_start_date: string | null;
  registration_end_date: string | null;
  phone_number: string | null;
  website_url: string | null;
  instagram_handle: string | null;
}

interface SupabaseExam {
  id: string;
  school_id: string;
  title: string;
  exam_date: string | null;
  exam_location: string | null;
  application_start_date: string | null;
  application_deadline: string | null;
  applicable_grades: string[] | null;
  scholarship_rate: number | null;
  is_verified: boolean;
  is_featured: boolean;
  application_url: string | null;
  notes: string | null;
}

function pickLogoColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  const idx = Math.abs(hash) % FALLBACK_LOGO_COLORS.length;
  return FALLBACK_LOGO_COLORS[idx];
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function mapSchool(row: SupabaseSchool): School {
  return {
    id: row.id,
    name: row.name,
    district: row.district,
    city: row.city,
    campus: row.campus_name ?? undefined,
    phone: row.phone_number ?? undefined,
    website: row.website_url ?? undefined,
    instagram: row.instagram_handle ?? undefined,
    verified: row.is_verified,
    isPremium: row.is_premium,
    logoColor: pickLogoColor(row.id),
    description: row.about_text ?? undefined,
    registrationStartDate: row.registration_start_date ?? undefined,
    registrationDeadline: row.registration_end_date ?? undefined,
  };
}

function deriveExamStatus(row: SupabaseExam): Exam['status'] {
  const today = todayIso();
  if (!row.application_deadline) return row.is_verified ? 'open' : 'upcoming';
  if (row.application_deadline < today) return 'closed';
  if (row.application_start_date && row.application_start_date > today) return 'upcoming';
  return 'open';
}

function mapExam(row: SupabaseExam, schoolMap: Map<string, School>): Exam {
  const school = schoolMap.get(row.school_id);
  return {
    id: row.id,
    schoolId: row.school_id,
    examName: row.title,
    examDate: row.exam_date ?? '',
    applicationStartDate: row.application_start_date ?? undefined,
    applicationDeadline: row.application_deadline ?? '',
    eligibleGrades: row.applicable_grades ?? [],
    district: school?.district ?? '',
    city: school?.city ?? 'İzmir',
    status: deriveExamStatus(row),
    verificationStatus: row.is_verified ? 'verified' : 'pending',
    sourceType: 'official_website',
    isFeatured: row.is_featured,
    examLocation: row.exam_location ?? undefined,
    applicationUrl: row.application_url ?? undefined,
    notes: row.notes ?? undefined,
  };
}

export interface FetchedData {
  schools: School[];
  exams: Exam[];
}

export async function fetchDataFromSupabase(): Promise<FetchedData | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const [schoolRows, examRows] = await Promise.all([
      selectRows<SupabaseSchool>('schools', 'select=*&order=name.asc'),
      selectRows<SupabaseExam>('exams', 'select=*&order=exam_date.asc'),
    ]);

    if (!schoolRows.length && !examRows.length) return null;

    const schools = schoolRows.map(mapSchool);
    const schoolMap = new Map(schools.map((s) => [s.id, s] as const));
    const exams = examRows.map((row) => mapExam(row, schoolMap));

    return { schools, exams };
  } catch (err) {
    console.warn('[dataService] Supabase verisi alınamadı, mock veriye düşüldü.', err);
    return null;
  }
}
