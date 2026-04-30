import { Exam, PendingUpdate, School } from '../types';

function dayOffset(days: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export const IZMIR_DISTRICTS = [
  'Tümü', 'Aliağa', 'Balçova', 'Bayraklı', 'Bornova', 'Buca', 'Çeşme', 'Çiğli',
  'Gaziemir', 'Güzelbahçe', 'Karabağlar', 'Karşıyaka', 'Konak', 'Menemen',
  'Narlıdere', 'Urla', 'Bayındır', 'Foça', 'Torbalı',
];

export const GRADES = [
  'Tümü', '1. Sınıf', '2. Sınıf', '3. Sınıf', '4. Sınıf', '5. Sınıf',
  '6. Sınıf', '7. Sınıf', '8. Sınıf', '9. Sınıf', '10. Sınıf', '11. Sınıf', '12. Sınıf',
];

export const SCHOOLS: School[] = [
  { id: 's1', name: 'Özel Ege Yıldız Koleji',        district: 'Bornova',    city: 'İzmir', campus: 'Ana Kampüs',          phone: '0 232 388 00 00', website: 'egeyildiz.k12.tr',    instagram: '@egeyildizkoleji', verified: true,  logoColor: '#1A3A6B', registrationStartDate: dayOffset(-30), registrationDeadline: dayOffset(60),  description: 'Bornova merkezde, anaokulundan liseye 1.250 öğrenciyle eğitim veren köklü kurum.' },
  { id: 's2', name: 'Özel İzmir Amerikan Koleji',     district: 'Karşıyaka',  city: 'İzmir', campus: 'Karşıyaka Kampüsü',   phone: '0 232 369 12 12', website: 'iac.k12.tr',          instagram: '@iac_izmir',       verified: true,  logoColor: '#0EA5E9', registrationStartDate: dayOffset(-15), registrationDeadline: dayOffset(45),  description: 'İki dilli müfredatıyla tanınan, Cambridge IGCSE programı uygulayan özel kolej.' },
  { id: 's3', name: 'Özel Bahçeşehir Buca Koleji',    district: 'Buca',       city: 'İzmir', campus: 'Buca Kampüsü',        phone: '0 232 487 30 30', website: 'bahcesehir.k12.tr',   instagram: undefined,          verified: true,  logoColor: '#2563EB', registrationStartDate: dayOffset(-7),  registrationDeadline: dayOffset(75),  description: 'Bahçeşehir Eğitim Kurumlarının Buca yerleşkesi, STEM odaklı.' },
  { id: 's4', name: 'Özel Çakabey Okulları',          district: 'Narlıdere',  city: 'İzmir', campus: 'Narlıdere Yerleşkesi',phone: '0 232 238 28 38', website: 'cakabey.k12.tr',     instagram: '@cakabeyokullari', verified: true,  logoColor: '#7C3AED', registrationStartDate: dayOffset(0),   registrationDeadline: dayOffset(90),  description: 'IB Dünya Okulu sertifikalı, yabancı dil ağırlıklı eğitim veren özel kolej.' },
  { id: 's5', name: 'Özel Tevfik Fikret Lisesi',      district: 'Bornova',    city: 'İzmir', campus: undefined,             phone: '0 232 388 00 33', website: 'tevfikfikret.k12.tr', instagram: undefined,          verified: true,  logoColor: '#0F766E', registrationStartDate: dayOffset(5),   registrationDeadline: dayOffset(80),  description: 'Türk-Fransız eğitim geleneğine sahip, baccalauréat hazırlığı sunan lise.' },
  { id: 's6', name: 'Özel Doğa Koleji İzmir',        district: 'Çiğli',      city: 'İzmir', campus: 'Çiğli Kampüsü',      phone: '0 232 386 00 00', website: 'dogakoleji.com',     instagram: undefined,          verified: true,  logoColor: '#16A34A', registrationStartDate: dayOffset(-20), registrationDeadline: dayOffset(50),  description: 'Doğa Koleji ekosisteminin İzmir Çiğli yerleşkesi.' },
  { id: 's7', name: 'Özel İTÜ ETA Vakfı Koleji',     district: 'Bayraklı',   city: 'İzmir', campus: undefined,             phone: '0 232 477 00 00', website: 'eta.k12.tr',          instagram: undefined,          verified: false, logoColor: '#DC2626', registrationStartDate: dayOffset(10),  registrationDeadline: dayOffset(70),  description: 'ETA Vakfı bünyesinde mühendislik odaklı müfredat sunan kurum.' },
  { id: 's8', name: 'Özel Mavişehir Final Okulları', district: 'Karşıyaka',  city: 'İzmir', campus: undefined,             phone: '0 232 324 32 32', website: undefined,             instagram: undefined,          verified: true,  logoColor: '#EA580C', registrationStartDate: dayOffset(-40), registrationDeadline: dayOffset(20),  description: 'Mavişehir merkezinde anaokulu-lise birleşik kampüs.' },
];

export const EXAMS: Exam[] = [
  { id: 'e1',  schoolId: 's1', examName: '2026 Bursluluk Sınavı – İlkokul ve Ortaokul', examDate: dayOffset(1),  applicationStartDate: dayOffset(-20), applicationDeadline: dayOffset(0),  eligibleGrades: ['4. Sınıf','5. Sınıf','6. Sınıf','7. Sınıf','8. Sınıf'], district: 'Bornova',   city: 'İzmir', status: 'open',     verificationStatus: 'verified', sourceType: 'official_website', scholarshipScore: 92, isFeatured: true,  examLocation: 'Ana Kampüs · Konferans Salonu', applicationUrl: 'https://egeyildiz.k12.tr', notes: 'Sınav sonuçları 7 gün içinde web sitesinden açıklanır.' },
  { id: 'e2',  schoolId: 's2', examName: '2026 Lise Bursluluk Sınavı',                   examDate: dayOffset(7),  applicationStartDate: dayOffset(-14), applicationDeadline: dayOffset(5),  eligibleGrades: ['8. Sınıf','9. Sınıf','10. Sınıf','11. Sınıf'],          district: 'Karşıyaka', city: 'İzmir', status: 'open',     verificationStatus: 'verified', sourceType: 'official_website', scholarshipScore: 88, isFeatured: true,  examLocation: 'Karşıyaka Kampüsü', applicationUrl: 'https://iac.k12.tr' },
  { id: 'e3',  schoolId: 's3', examName: 'STEM Burs Programı Giriş Sınavı',              examDate: dayOffset(14), applicationStartDate: dayOffset(-7),  applicationDeadline: dayOffset(12), eligibleGrades: ['5. Sınıf','6. Sınıf','7. Sınıf'],                       district: 'Buca',      city: 'İzmir', status: 'open',     verificationStatus: 'verified', sourceType: 'official_website', scholarshipScore: 78, isFeatured: false },
  { id: 'e4',  schoolId: 's4', examName: 'IB Hazırlık Bursluluk Sınavı',                 examDate: dayOffset(21), applicationStartDate: dayOffset(-3),  applicationDeadline: dayOffset(18), eligibleGrades: ['8. Sınıf','9. Sınıf'],                                  district: 'Narlıdere', city: 'İzmir', status: 'open',     verificationStatus: 'verified', sourceType: 'official_website', scholarshipScore: 85, isFeatured: true },
  { id: 'e5',  schoolId: 's5', examName: 'Türk-Fransız Lisesi Burs Sınavı',              examDate: dayOffset(28), applicationStartDate: dayOffset(0),   applicationDeadline: dayOffset(25), eligibleGrades: ['8. Sınıf','9. Sınıf'],                                  district: 'Bornova',   city: 'İzmir', status: 'open',     verificationStatus: 'pending',  sourceType: 'social_media',    scholarshipScore: 71, isFeatured: false },
  { id: 'e6',  schoolId: 's6', examName: 'Doğa Burs Programı 2026',                     examDate: dayOffset(10), applicationStartDate: dayOffset(-10), applicationDeadline: dayOffset(8),  eligibleGrades: ['4. Sınıf','5. Sınıf','6. Sınıf','7. Sınıf','8. Sınıf','9. Sınıf'], district: 'Çiğli', city: 'İzmir', status: 'open', verificationStatus: 'verified', sourceType: 'official_website', scholarshipScore: 76, isFeatured: false },
  { id: 'e7',  schoolId: 's7', examName: 'ETA Mühendislik Bursu Seçim Sınavı',           examDate: dayOffset(35), applicationStartDate: dayOffset(5),   applicationDeadline: dayOffset(32), eligibleGrades: ['9. Sınıf','10. Sınıf'],                                 district: 'Bayraklı',  city: 'İzmir', status: 'upcoming', verificationStatus: 'pending',  sourceType: 'instagram',       scholarshipScore: 64, isFeatured: false },
  { id: 'e8',  schoolId: 's8', examName: 'Mavişehir Final Bursluluk',                    examDate: dayOffset(-7), applicationStartDate: dayOffset(-30), applicationDeadline: dayOffset(-10),eligibleGrades: ['4. Sınıf','5. Sınıf','6. Sınıf'],                       district: 'Karşıyaka', city: 'İzmir', status: 'closed',   verificationStatus: 'outdated', sourceType: 'official_website', scholarshipScore: 55, isFeatured: false },
  { id: 'e9',  schoolId: 's1', examName: 'Lise Bursluluk Tamamlayıcı Sınav',             examDate: dayOffset(42), applicationStartDate: dayOffset(10),  applicationDeadline: dayOffset(38), eligibleGrades: ['9. Sınıf','10. Sınıf','11. Sınıf'],                     district: 'Bornova',   city: 'İzmir', status: 'upcoming', verificationStatus: 'verified', sourceType: 'official_website', scholarshipScore: 70, isFeatured: false },
  { id: 'e10', schoolId: 's2', examName: 'IGCSE Hazırlık Burs Sınavı',                   examDate: dayOffset(49), applicationStartDate: dayOffset(15),  applicationDeadline: dayOffset(46), eligibleGrades: ['7. Sınıf','8. Sınıf'],                                  district: 'Karşıyaka', city: 'İzmir', status: 'upcoming', verificationStatus: 'verified', sourceType: 'official_website', scholarshipScore: 82, isFeatured: false },
];

export const PENDING_UPDATES: PendingUpdate[] = [
  { id: 'p1', schoolName: 'Özel Ege Lisesi',        type: 'new_exam',    detected: '2026 Bursluluk Sınavı',                              detectedDate: dayOffset(60), source: 'egelisesi.k12.tr',        confidence: 0.86, status: 'pending' },
  { id: 'p2', schoolName: 'Özel Çakabey Okulları',  type: 'date_change', detected: `Sınav tarihi değişti: ${dayOffset(21)} → ${dayOffset(24)}`,                source: 'cakabey.k12.tr',          confidence: 0.92, status: 'pending' },
  { id: 'p3', schoolName: 'Özel TED İzmir Koleji',  type: 'new_exam',    detected: 'Burs Sınavı 2026',                                   detectedDate: dayOffset(33), source: 'instagram.com/tedizmir', confidence: 0.71, status: 'pending' },
];

export function getSchool(id: string): School | undefined {
  return SCHOOLS.find((s) => s.id === id);
}

export function getExam(id: string): Exam | undefined {
  return EXAMS.find((e) => e.id === id);
}

export function getExamsBySchool(schoolId: string): Exam[] {
  return EXAMS.filter((e) => e.schoolId === schoolId);
}
