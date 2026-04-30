-- ============================================================
-- BursRadar — Ana Şema
-- ============================================================
-- Kullanım:
--   Supabase Dashboard → SQL Editor → Bu dosyayı yapıştır → Run
--
-- ÖNEMLİ: Mevcut tüm verileri siler ve yeniden oluşturur.
--         İlk kurulumda veya sıfırdan başlarken kullanın.
-- ============================================================


-- ─── Mevcut tabloları temizle ────────────────────────────────────────────────
DROP TABLE IF EXISTS exams   CASCADE;
DROP TABLE IF EXISTS schools CASCADE;
DROP FUNCTION IF EXISTS set_updated_at CASCADE;


-- ─── updated_at otomatik güncelleme ──────────────────────────────────────────
CREATE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


-- ════════════════════════════════════════════════════════════
-- SCHOOLS — Okullar
-- ════════════════════════════════════════════════════════════
CREATE TABLE schools (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Kimlik
  name                    TEXT        NOT NULL,
  campus_name             TEXT,
  city                    TEXT        NOT NULL DEFAULT 'İzmir',
  district                TEXT        NOT NULL,

  -- Durum
  is_verified             BOOLEAN     NOT NULL DEFAULT false,
  is_premium              BOOLEAN     NOT NULL DEFAULT false,

  -- İletişim
  phone_number            TEXT,
  website_url             TEXT,
  instagram_handle        TEXT,

  -- İçerik
  about_text              TEXT,

  -- Kayıt dönemi
  registration_start_date DATE,
  registration_end_date   DATE,

  -- Zaman damgaları
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  schools                            IS 'Burs sınavı düzenleyen okullar';
COMMENT ON COLUMN schools.name                       IS 'Okulun tam resmi adı — örn: Özel Ege Lisesi';
COMMENT ON COLUMN schools.campus_name                IS 'Kampüs adı — örn: Bornova Ana Kampüsü';
COMMENT ON COLUMN schools.city                       IS 'Şehir — varsayılan: İzmir';
COMMENT ON COLUMN schools.district                   IS 'İlçe — örn: Bornova, Karşıyaka, Konak';
COMMENT ON COLUMN schools.is_verified                IS 'Okul bilgileri doğrulandı mı? true → onaylı rozeti gösterir';
COMMENT ON COLUMN schools.is_premium                 IS 'Öne çıkan premium kurum — özel listeleme sırası';
COMMENT ON COLUMN schools.phone_number               IS 'İletişim telefonu — örn: 0 232 388 28 88';
COMMENT ON COLUMN schools.website_url                IS 'Resmi web sitesi — örn: https://egelisesi.k12.tr';
COMMENT ON COLUMN schools.instagram_handle           IS 'Instagram kullanıcı adı — örn: @ozelegelisesi';
COMMENT ON COLUMN schools.about_text                 IS 'Okul hakkında kısa açıklama (maks ~200 karakter)';
COMMENT ON COLUMN schools.registration_start_date    IS 'Kayıt dönemi başlangıç tarihi — YYYY-MM-DD';
COMMENT ON COLUMN schools.registration_end_date      IS 'Kayıt dönemi bitiş tarihi — YYYY-MM-DD';

CREATE TRIGGER trg_schools_updated_at
  BEFORE UPDATE ON schools
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX schools_district_idx ON schools (district);
CREATE INDEX schools_verified_idx ON schools (is_verified);


-- ════════════════════════════════════════════════════════════
-- EXAMS — Sınavlar
-- ════════════════════════════════════════════════════════════
CREATE TABLE exams (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- İlişki
  school_id               UUID        NOT NULL REFERENCES schools(id) ON DELETE CASCADE,

  -- Sınav bilgisi
  title                   TEXT        NOT NULL,
  exam_date               DATE,
  exam_location           TEXT,

  -- Başvuru dönemi
  application_start_date  DATE,
  application_deadline    DATE,

  -- Hedef kitle
  applicable_grades       TEXT[]      NOT NULL DEFAULT '{}',

  -- Burs
  scholarship_rate        INTEGER     CHECK (scholarship_rate BETWEEN 0 AND 100),

  -- Yayın durumu
  is_verified             BOOLEAN     NOT NULL DEFAULT true,
  is_featured             BOOLEAN     NOT NULL DEFAULT false,

  -- Ek bilgi
  application_url         TEXT,
  notes                   TEXT,

  -- Zaman damgaları
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  exams                              IS 'Okulların düzenlediği burs sınavları';
COMMENT ON COLUMN exams.school_id                   IS 'Bağlı okul — schools tablosundan seçin';
COMMENT ON COLUMN exams.title                       IS 'Sınav adı — örn: 2026 Bursluluk Sınavı – Ortaokul';
COMMENT ON COLUMN exams.exam_date                   IS 'Sınav tarihi — YYYY-MM-DD';
COMMENT ON COLUMN exams.exam_location               IS 'Sınav yeri — örn: Ana Kampüs · A Blok Konferans Salonu';
COMMENT ON COLUMN exams.application_start_date      IS 'Başvuru açılış tarihi — YYYY-MM-DD';
COMMENT ON COLUMN exams.application_deadline        IS 'Son başvuru tarihi — YYYY-MM-DD';
COMMENT ON COLUMN exams.applicable_grades           IS 'Katılabilecek sınıflar — örn: {"5. Sınıf","6. Sınıf","7. Sınıf"}';
COMMENT ON COLUMN exams.scholarship_rate            IS 'Burs oranı % — örn: 25, 50, 75, 100. Boş bırakılabilir.';
COMMENT ON COLUMN exams.is_verified                 IS 'Sınav yayında mı? false → gizli taslak';
COMMENT ON COLUMN exams.is_featured                 IS 'Ana sayfada öne çıkarılsın mı?';
COMMENT ON COLUMN exams.application_url             IS 'Başvuru veya bilgi sayfası linki';
COMMENT ON COLUMN exams.notes                       IS 'Kullanıcılara gösterilecek ek notlar';

CREATE TRIGGER trg_exams_updated_at
  BEFORE UPDATE ON exams
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX exams_school_idx    ON exams (school_id);
CREATE INDEX exams_date_idx      ON exams (exam_date);
CREATE INDEX exams_verified_idx  ON exams (is_verified, exam_date);
CREATE INDEX exams_featured_idx  ON exams (is_featured) WHERE is_featured = true;


-- ════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ════════════════════════════════════════════════════════════
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams   ENABLE ROW LEVEL SECURITY;

-- Uygulama (anon key): yalnızca okuma
CREATE POLICY "schools: herkes okuyabilir" ON schools FOR SELECT USING (true);
CREATE POLICY "exams: herkes okuyabilir"   ON exams   FOR SELECT USING (true);

-- Yazma yalnızca Supabase Dashboard (service_role) üzerinden yapılır.
-- Anon key üzerinden yazma kasıtlı olarak kapalıdır.


-- ─── Kontrol ─────────────────────────────────────────────────────────────────
SELECT
  (SELECT count(*) FROM schools) AS okul_sayisi,
  (SELECT count(*) FROM exams)   AS sinav_sayisi;
