// ── Web sitesi arama sorguları ─────────────────────────────────────────────────
export const IZMIR_PRIVATE_SCHOOL_SEARCH_QUERIES = [
  'site:k12.tr İzmir özel okul bursluluk sınavı',
  'site:k12.tr İzmir kolej bursluluk sınavı',
  'site:k12.tr İzmir özel okul kabul sınavı',
  'site:k12.tr İzmir özel lise bursluluk',
  'İzmir özel okul bursluluk sınavı başvuru',
  'İzmir kolej bursluluk sınavı başvuru',
];

// ── Sosyal medya arama örüntüleri ─────────────────────────────────────────────
export const SOCIAL_MEDIA_URL_PATTERNS = {
  instagram: {
    // Kaynak URL'si bu biçimlerden birinde olabilir:
    // "@bahcesehirkoleji"  →  https://www.instagram.com/bahcesehirkoleji/
    // "bahcesehirkoleji"
    // "https://www.instagram.com/bahcesehirkoleji/"
    prefix: 'https://www.instagram.com/',
    handlePattern: /^@?([A-Za-z0-9._]+)$/,
    publicUrl: (handle: string) =>
      `https://www.instagram.com/${handle.replace(/^@/, '')}/`,
  },
  facebook: {
    prefix: 'https://www.facebook.com/',
    handlePattern: /^@?([A-Za-z0-9.]+)$/,
    publicUrl: (handle: string) =>
      `https://www.facebook.com/${handle.replace(/^@/, '')}`,
  },
  twitter: {
    prefix: 'https://x.com/',
    handlePattern: /^@?([A-Za-z0-9_]+)$/,
    publicUrl: (handle: string) =>
      `https://x.com/${handle.replace(/^@/, '')}`,
  },
} as const;

// ── Kaynak türü etiketleri (UI'da gösterim için) ───────────────────────────────
export const SOURCE_TYPE_LABELS: Record<string, string> = {
  official_website: '🌐 Resmi Web',
  social_media:     '📱 Sosyal Medya',
  instagram:        '📸 Instagram',
  facebook:         '📘 Facebook',
  twitter:          '🐦 X/Twitter',
  phone:            '📞 Telefon',
  email:            '✉️ E-posta',
  manual:           '✏️ Manuel',
};

// ── Şehir ve okul filtreleri ───────────────────────────────────────────────────
export const IZMIR_BOT_ALLOWED_CITY = 'İzmir';

export const IZMIR_BOT_REQUIRED_SIGNALS = {
  city: ['İzmir'],
  privateSchool: ['özel', 'kolej', 'koleji', 'okulları', 'lisesi'],
  scholarshipExam: ['bursluluk', 'burs', 'sınav', 'sınavı', 'başvuru', 'kayıt'],
  // Sosyal medya gönderilerinde sık kullanılan ifadeler
  socialMediaExam: [
    'bursluluk sınavı',
    'burs sınavı tarihi',
    'başvurular başladı',
    'son başvuru',
    'sınav tarihi',
    'kayıt tarihleri',
    'burslu öğrenci',
    'başvuru formu',
  ],
};

export const IZMIR_BOT_REJECT_SIGNALS = [
  'dershane',
  'kurs merkezi',
  'üniversite',
  'ana sayfa reklam',
  'iş ilanı',
];

// ── Güven skoru eşikleri ───────────────────────────────────────────────────────
export const IZMIR_BOT_CONFIDENCE_LIMITS = {
  // Bu eşiğin üzerindeki tespitler otomatik kuyruğa alınır
  autoQueue: 0.65,
  // Bu eşiğin üzerindekiler admin'e öncelikli gösterilir
  needsHumanReview: 0.8,
  // Bu eşiğin üzerindekiler "yüksek güven" rozeti alır
  highConfidence: 0.9,
};

// ── Edge Function tetikleme ────────────────────────────────────────────────────
// SUPABASE_URL ortam değişkeninden otomatik türetilir; değiştirme.
export const BOT_EDGE_FUNCTION_PATH = '/functions/v1/run-bot';
