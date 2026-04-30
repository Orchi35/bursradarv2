-- ============================================================
-- BursRadar — Okul Seed Verisi
-- ============================================================
-- Kullanım:
--   schema.sql çalıştırıldıktan SONRA bu dosyayı çalıştırın.
--   Mevcut kayıtları değiştirmez (ON CONFLICT DO NOTHING).
--
-- applicable_grades formatı için referans:
--   {"1. Sınıf","2. Sınıf","3. Sınıf","4. Sınıf","5. Sınıf",
--    "6. Sınıf","7. Sınıf","8. Sınıf","9. Sınıf","10. Sınıf",
--    "11. Sınıf","12. Sınıf"}
-- ============================================================

INSERT INTO schools (
  name, campus_name, city, district,
  is_verified, is_premium,
  about_text,
  registration_start_date, registration_end_date,
  phone_number, website_url, instagram_handle
) VALUES
  (
    'Özel Ege Lisesi', 'Ana Kampüs', 'İzmir', 'Bornova',
    true, true,
    'İzmir''in en köklü eğitim kurumlarından biri. Anaokulundan liseye yenilikçi eğitim modeli.',
    '2026-03-01', '2026-06-30',
    '0 232 388 28 88', 'https://egelisesi.k12.tr', '@ozelegelisesi'
  ),
  (
    'İzmir Özel Ekin Okulları', 'Ataşehir Kampüsü', 'İzmir', 'Çiğli',
    true, false,
    'Öğrenci merkezli, çağdaş ve bilimsel temellere dayalı eğitim vizyonu.',
    '2026-04-01', '2026-07-15',
    '444 35 76', 'https://ekinokullari.k12.tr', '@ekinokullari'
  ),
  (
    'Özel Çakabey Okulları', 'Sasalı Kampüsü', 'İzmir', 'Çiğli',
    true, true,
    'Uluslararası standartlarda, doğayla iç içe kampüsünde tam donanımlı eğitim.',
    '2026-02-15', '2026-05-30',
    '0 232 327 31 31', 'https://cakabey.k12.tr', '@cakabeyokullari'
  ),
  (
    'İzmir Gelişim Koleji', 'Ulukent Kampüsü', 'İzmir', 'Menemen',
    false, false,
    'Akademik başarıyı sosyal ve sportif gelişimle destekleyen eğitim ortamı.',
    '2026-03-10', '2026-06-15',
    '0 232 833 32 32', 'https://gelisim.k12.tr', '@izmirgelisimkoleji'
  ),
  (
    'İzmir Türk Koleji', 'Bahattin Tatış Kampüsü', 'İzmir', 'Konak',
    true, true,
    'Yarım asrı aşan tecrübesiyle İzmir''in simge eğitim kurumlarından.',
    '2026-01-20', '2026-05-20',
    '0 232 244 05 00', 'https://izmirturkkoleji.k12.tr', '@izmirturkkoleji'
  ),
  (
    'Özel İzmir Amerikan Koleji', 'Göztepe Kampüsü', 'İzmir', 'Konak',
    true, false,
    'Köklü tarihi ve uluslararası bakalorya (IB) programı ile dünya standartlarında lise eğitimi.',
    '2026-05-01', '2026-08-01',
    '0 232 464 26 69', 'https://aci.k12.tr', '@izmiramerikankoleji'
  ),
  (
    'Kent Koleji', 'Gaziemir Kampüsü', 'İzmir', 'Gaziemir',
    true, false,
    'Teknoloji odaklı sınıfları ve modern eğitim yaklaşımıyla İzmir''in parlayan yıldızı.',
    '2026-03-15', '2026-07-01',
    '0 232 251 55 61', 'https://kentkoleji.k12.tr', '@kentkoleji'
  ),
  (
    'MEV Koleji Özel İzmir Okulları', 'Güzelbahçe Kampüsü', 'İzmir', 'Güzelbahçe',
    true, false,
    'Milli Eğitim Vakfı güvencesiyle, deniz manzaralı kampüste ayrıcalıklı eğitim.',
    '2026-04-10', '2026-08-15',
    '0 232 234 28 28', 'https://mevkolejiguzelbahce.k12.tr', '@mevkolejiizmir'
  ),
  (
    'TAKEV Okulları', 'Narlıdere Kampüsü', 'İzmir', 'Narlıdere',
    true, true,
    'Almanca ve İngilizce çift yabancı dil ağırlıklı akademik program.',
    '2026-02-01', '2026-05-31',
    '0 232 238 88 00', 'https://takevokullari.k12.tr', '@takevokullari'
  ),
  (
    'İYTEV Yücel Tonguç Koleji', 'Kalabak Kampüsü', 'İzmir', 'Urla',
    false, false,
    'İzmir Yüksek Teknoloji Enstitüsü Vakfı desteğiyle bilim ve teknoloji odaklı eğitim.',
    '2026-03-20', '2026-06-20',
    '0 232 766 11 23', 'https://yuceltonguc.k12.tr', '@yuceltonguckoleji'
  )
ON CONFLICT DO NOTHING;

SELECT count(*) AS eklenen_okul FROM schools;
