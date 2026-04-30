// BursRadar mock data — İzmir özel okul burs sınavları
// Anchored to "today" so countdowns stay realistic regardless of when this is viewed.
const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

function dayOffset(days) {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

window.IZMIR_DISTRICTS = [
  'Tümü','Aliağa','Balçova','Bayraklı','Bornova','Buca','Çeşme','Çiğli',
  'Gaziemir','Güzelbahçe','Karabağlar','Karşıyaka','Konak','Menemen',
  'Narlıdere','Urla','Bayındır','Foça','Torbalı'
];

window.GRADES = [
  'Tümü','1. Sınıf','2. Sınıf','3. Sınıf','4. Sınıf','5. Sınıf',
  '6. Sınıf','7. Sınıf','8. Sınıf','9. Sınıf','10. Sınıf','11. Sınıf','12. Sınıf'
];

// Her okula kayıt dönemi tarihleri eklendi (registrationStartDate, registrationDeadline)
window.SCHOOLS = [
  { id: 's1', name: 'Özel Ege Yıldız Koleji', district: 'Bornova', city: 'İzmir',
    campus: 'Ana Kampüs', phone: '0 232 388 00 00', website: 'egeyildiz.k12.tr',
    instagram: '@egeyildizkoleji', verified: true, logoColor: '#1A3A6B',
    registrationStartDate: dayOffset(-30), registrationDeadline: dayOffset(60),
    description: 'Bornova merkezde, anaokulundan liseye 1.250 öğrenciyle eğitim veren köklü kurum.' },
  { id: 's2', name: 'Özel İzmir Amerikan Koleji', district: 'Karşıyaka', city: 'İzmir',
    campus: 'Karşıyaka Kampüsü', phone: '0 232 369 12 12', website: 'iac.k12.tr',
    instagram: '@iac_izmir', verified: true, logoColor: '#0EA5E9',
    registrationStartDate: dayOffset(-15), registrationDeadline: dayOffset(45),
    description: 'İki dilli müfredatıyla tanınan, Cambridge IGCSE programı uygulayan özel kolej.' },
  { id: 's3', name: 'Özel Bahçeşehir Buca Koleji', district: 'Buca', city: 'İzmir',
    campus: 'Buca Kampüsü', phone: '0 232 487 30 30', website: 'bahcesehir.k12.tr',
    verified: true, logoColor: '#2563EB',
    registrationStartDate: dayOffset(-7), registrationDeadline: dayOffset(75),
    description: 'Bahçeşehir Eğitim Kurumlarının Buca yerleşkesi, STEM odaklı.' },
  { id: 's4', name: 'Özel Çakabey Okulları', district: 'Narlıdere', city: 'İzmir',
    campus: 'Narlıdere Yerleşkesi', phone: '0 232 238 28 38', website: 'cakabey.k12.tr',
    instagram: '@cakabeyokullari', verified: true, logoColor: '#7C3AED',
    registrationStartDate: dayOffset(0), registrationDeadline: dayOffset(90),
    description: 'IB Dünya Okulu sertifikalı, yabancı dil ağırlıklı eğitim veren özel kolej.' },
  { id: 's5', name: 'Özel Tevfik Fikret Lisesi', district: 'Bornova', city: 'İzmir',
    phone: '0 232 388 00 33', website: 'tevfikfikret.k12.tr', verified: true,
    logoColor: '#0F766E',
    registrationStartDate: dayOffset(5), registrationDeadline: dayOffset(80),
    description: 'Türk-Fransız eğitim geleneğine sahip, baccalauréat hazırlığı sunan lise.' },
  { id: 's6', name: 'Özel Doğa Koleji İzmir', district: 'Çiğli', city: 'İzmir',
    campus: 'Çiğli Kampüsü', phone: '0 232 386 00 00', website: 'dogakoleji.com',
    verified: true, logoColor: '#16A34A',
    registrationStartDate: dayOffset(-20), registrationDeadline: dayOffset(50),
    description: 'Doğa Koleji ekosisteminin İzmir Çiğli yerleşkesi.' },
  { id: 's7', name: 'Özel İTÜ ETA Vakfı Koleji', district: 'Bayraklı', city: 'İzmir',
    phone: '0 232 477 00 00', website: 'eta.k12.tr', verified: false,
    logoColor: '#DC2626',
    registrationStartDate: dayOffset(10), registrationDeadline: dayOffset(70),
    description: 'ETA Vakfı bünyesinde mühendislik odaklı müfredat sunan kurum.' },
  { id: 's8', name: 'Özel Mavişehir Final Okulları', district: 'Karşıyaka', city: 'İzmir',
    phone: '0 232 324 32 32', verified: true, logoColor: '#EA580C',
    registrationStartDate: dayOffset(-40), registrationDeadline: dayOffset(20),
    description: 'Mavişehir merkezinde anaokulu-lise birleşik kampüs.' }
];

// Okul kayıt dönemi durum etiketi
window.registrationStatus = function(school) {
  if (!school.registrationStartDate || !school.registrationDeadline) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const start = new Date(school.registrationStartDate); start.setHours(0,0,0,0);
  const end = new Date(school.registrationDeadline); end.setHours(0,0,0,0);
  if (today < start) return { state: 'upcoming', label: 'Kayıt Yakında' };
  if (today > end) return { state: 'closed', label: 'Kayıt Kapandı' };
  return { state: 'open', label: 'Kayıtlar Açık' };
};

window.EXAMS = [
  { id: 'e1', schoolId: 's1', examName: '2026 Bursluluk Sınavı – İlkokul ve Ortaokul',
    examDate: dayOffset(1), applicationStartDate: dayOffset(-20),
    applicationDeadline: dayOffset(0), eligibleGrades: ['4. Sınıf','5. Sınıf','6. Sınıf','7. Sınıf','8. Sınıf'],
    district: 'Bornova', city: 'İzmir', status: 'open', verificationStatus: 'verified',
    sourceType: 'official_website', scholarshipScore: 92, isFeatured: true,
    examLocation: 'Ana Kampüs · Konferans Salonu',
    notes: 'Sınav sonuçları 7 gün içinde web sitesinden açıklanır.' },
  { id: 'e2', schoolId: 's2', examName: '2026 Lise Bursluluk Sınavı',
    examDate: dayOffset(7), applicationStartDate: dayOffset(-14),
    applicationDeadline: dayOffset(5), eligibleGrades: ['8. Sınıf','9. Sınıf','10. Sınıf','11. Sınıf'],
    district: 'Karşıyaka', city: 'İzmir', status: 'open', verificationStatus: 'verified',
    sourceType: 'official_website', scholarshipScore: 88, isFeatured: true,
    examLocation: 'Karşıyaka Kampüsü' },
  { id: 'e3', schoolId: 's3', examName: 'STEM Burs Programı Giriş Sınavı',
    examDate: dayOffset(14), applicationStartDate: dayOffset(-7),
    applicationDeadline: dayOffset(12), eligibleGrades: ['5. Sınıf','6. Sınıf','7. Sınıf'],
    district: 'Buca', city: 'İzmir', status: 'open', verificationStatus: 'verified',
    sourceType: 'official_website', scholarshipScore: 78, isFeatured: false },
  { id: 'e4', schoolId: 's4', examName: 'IB Hazırlık Bursluluk Sınavı',
    examDate: dayOffset(21), applicationStartDate: dayOffset(-3),
    applicationDeadline: dayOffset(18), eligibleGrades: ['8. Sınıf','9. Sınıf'],
    district: 'Narlıdere', city: 'İzmir', status: 'open', verificationStatus: 'verified',
    sourceType: 'official_website', scholarshipScore: 85, isFeatured: true },
  { id: 'e5', schoolId: 's5', examName: 'Türk-Fransız Lisesi Burs Sınavı',
    examDate: dayOffset(28), applicationStartDate: dayOffset(0),
    applicationDeadline: dayOffset(25), eligibleGrades: ['8. Sınıf','9. Sınıf'],
    district: 'Bornova', city: 'İzmir', status: 'open', verificationStatus: 'pending',
    sourceType: 'social_media', scholarshipScore: 71, isFeatured: false },
  { id: 'e6', schoolId: 's6', examName: 'Doğa Burs Programı 2026',
    examDate: dayOffset(10), applicationStartDate: dayOffset(-10),
    applicationDeadline: dayOffset(8), eligibleGrades: ['4. Sınıf','5. Sınıf','6. Sınıf','7. Sınıf','8. Sınıf','9. Sınıf'],
    district: 'Çiğli', city: 'İzmir', status: 'open', verificationStatus: 'verified',
    sourceType: 'official_website', scholarshipScore: 76, isFeatured: false },
  { id: 'e7', schoolId: 's7', examName: 'ETA Mühendislik Bursu Seçim Sınavı',
    examDate: dayOffset(35), applicationStartDate: dayOffset(5),
    applicationDeadline: dayOffset(32), eligibleGrades: ['9. Sınıf','10. Sınıf'],
    district: 'Bayraklı', city: 'İzmir', status: 'upcoming', verificationStatus: 'pending',
    sourceType: 'instagram', scholarshipScore: 64, isFeatured: false },
  { id: 'e8', schoolId: 's8', examName: 'Mavişehir Final Bursluluk',
    examDate: dayOffset(-7), applicationStartDate: dayOffset(-30),
    applicationDeadline: dayOffset(-10), eligibleGrades: ['4. Sınıf','5. Sınıf','6. Sınıf'],
    district: 'Karşıyaka', city: 'İzmir', status: 'closed', verificationStatus: 'outdated',
    sourceType: 'official_website', scholarshipScore: 55, isFeatured: false },
  { id: 'e9', schoolId: 's1', examName: 'Lise Bursluluk Tamamlayıcı Sınav',
    examDate: dayOffset(42), applicationStartDate: dayOffset(10),
    applicationDeadline: dayOffset(38), eligibleGrades: ['9. Sınıf','10. Sınıf','11. Sınıf'],
    district: 'Bornova', city: 'İzmir', status: 'upcoming', verificationStatus: 'verified',
    sourceType: 'official_website', scholarshipScore: 70, isFeatured: false },
  { id: 'e10', schoolId: 's2', examName: 'IGCSE Hazırlık Burs Sınavı',
    examDate: dayOffset(49), applicationStartDate: dayOffset(15),
    applicationDeadline: dayOffset(46), eligibleGrades: ['7. Sınıf','8. Sınıf'],
    district: 'Karşıyaka', city: 'İzmir', status: 'upcoming', verificationStatus: 'verified',
    sourceType: 'official_website', scholarshipScore: 82, isFeatured: false }
];

// Helpers
window.formatDate = function(iso) {
  const d = new Date(iso);
  const months = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
  return d.getDate() + ' ' + months[d.getMonth()];
};

window.formatLongDate = function(iso) {
  const d = new Date(iso);
  const months = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  const days = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
  return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear() + ' · ' + days[d.getDay()];
};

window.daysUntil = function(iso) {
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
};

window.daysUntilLabel = function(iso) {
  const n = window.daysUntil(iso);
  if (n < 0) return Math.abs(n) + ' gün geçti';
  if (n === 0) return 'Bugün';
  if (n === 1) return 'Yarın';
  return n + ' gün kaldı';
};

window.urgency = function(iso) {
  const n = window.daysUntil(iso);
  if (n < 0) return 'past';
  if (n <= 1) return 'urgent';
  if (n <= 7) return 'soon';
  return 'normal';
};

window.schoolInitials = function(name) {
  // Skip "Özel" if it's the first word
  const words = name.split(' ').filter(w => w.toLowerCase() !== 'özel');
  return words.slice(0, 2).map(w => w[0]).join('').toUpperCase();
};

window.getSchool = function(id) { return window.SCHOOLS.find(s => s.id === id); };
window.getExam = function(id) { return window.EXAMS.find(e => e.id === id); };
window.getExamsBySchool = function(id) { return window.EXAMS.filter(e => e.schoolId === id); };
