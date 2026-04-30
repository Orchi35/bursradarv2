-- ============================================================
-- BursRadar — Sınav Seed Verisi (Örnek)
-- ============================================================
-- Kullanım:
--   schema.sql ve seed_schools.sql çalıştırıldıktan SONRA.
--   Gerçek sınav eklerken bu dosyayı şablon olarak kullanın.
--
-- applicable_grades için geçerli değerler:
--   "1. Sınıf" "2. Sınıf" "3. Sınıf" "4. Sınıf"  (ilkokul)
--   "5. Sınıf" "6. Sınıf" "7. Sınıf" "8. Sınıf"  (ortaokul)
--   "9. Sınıf" "10. Sınıf" "11. Sınıf" "12. Sınıf" (lise)
--
-- scholarship_rate: burs yüzdesi (0-100). Boş bırakmak için NULL.
-- is_verified: true → yayında, false → taslak (gizli)
-- is_featured: true → Ana Sayfa'da öne çıkar
-- ============================================================

INSERT INTO exams (
  school_id,
  title,
  exam_date,
  application_start_date,
  application_deadline,
  applicable_grades,
  scholarship_rate,
  exam_location,
  application_url,
  notes,
  is_verified,
  is_featured
)
SELECT
  s.id,
  x.title,
  x.exam_date::DATE,
  x.application_start_date::DATE,
  x.application_deadline::DATE,
  x.applicable_grades,
  x.scholarship_rate,
  x.exam_location,
  x.application_url,
  x.notes,
  x.is_verified,
  x.is_featured
FROM (VALUES
  -- Özel Ege Lisesi
  (
    'Özel Ege Lisesi',
    '2026 İlkokul ve Ortaokul Bursluluk Sınavı',
    '2026-05-10', '2026-04-01', '2026-05-05',
    ARRAY['4. Sınıf','5. Sınıf','6. Sınıf','7. Sınıf','8. Sınıf'],
    50,
    'Ana Kampüs · Konferans Salonu',
    'https://egelisesi.k12.tr/burs',
    'Sınav sonuçları 7 gün içinde web sitesinden açıklanır.',
    true, true
  ),
  -- Özel Çakabey Okulları
  (
    'Özel Çakabey Okulları',
    '2026 Lise Bursluluk Sınavı',
    '2026-05-24', '2026-04-15', '2026-05-18',
    ARRAY['8. Sınıf','9. Sınıf'],
    75,
    'Sasalı Kampüsü · B Blok',
    'https://cakabey.k12.tr/bursluluk',
    NULL,
    true, false
  ),
  -- İzmir Türk Koleji
  (
    'İzmir Türk Koleji',
    '2026 Ortaokul Burs Sınavı',
    '2026-06-07', '2026-04-20', '2026-06-01',
    ARRAY['5. Sınıf','6. Sınıf','7. Sınıf','8. Sınıf'],
    100,
    'Bahattin Tatış Kampüsü',
    'https://izmirturkkoleji.k12.tr/burs',
    '%100 burs kazananlar tüm öğrenim süresince ücretsiz okur.',
    true, true
  ),
  -- TAKEV Okulları
  (
    'TAKEV Okulları',
    '2026 Dil Ağırlıklı Bursluluk Sınavı',
    '2026-05-17', '2026-03-15', '2026-05-10',
    ARRAY['4. Sınıf','5. Sınıf','6. Sınıf','7. Sınıf','8. Sınıf'],
    25,
    'Narlıdere Kampüsü · Merkez Bina',
    NULL,
    'Almanca veya İngilizce dil ağırlıklı program için ayrı burs kontenjanı.',
    true, false
  ),
  -- Kent Koleji
  (
    'Kent Koleji',
    '2026 STEM Burs Programı',
    '2026-06-14', '2026-05-01', '2026-06-08',
    ARRAY['6. Sınıf','7. Sınıf','8. Sınıf'],
    50,
    'Gaziemir Kampüsü · Bilim Merkezi',
    'https://kentkoleji.k12.tr/stem-burs',
    'Sınav matematik ve fen ağırlıklıdır. Proje sunumu aşaması dahildir.',
    true, false
  )
) AS x(
  school_name, title,
  exam_date, application_start_date, application_deadline,
  applicable_grades, scholarship_rate,
  exam_location, application_url, notes,
  is_verified, is_featured
)
JOIN schools s ON s.name = x.school_name
ON CONFLICT DO NOTHING;

SELECT count(*) AS eklenen_sinav FROM exams;
