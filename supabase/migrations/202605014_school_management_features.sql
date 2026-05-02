-- ============================================================
-- BursRadar School Management Features
-- ============================================================
-- Supabase Dashboard -> SQL Editor icinde calistir.
-- Mevcut role/paket mantigini degistirmez; aktif paketli okul hesaplari
-- ve admin icin logo yukleme + sinav ekleme yuzeyini tamamlar.

ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS logo_url TEXT;

COMMENT ON COLUMN schools.logo_url IS 'Okul profilinde gosterilecek logo/profil gorseli URL adresi.';

DROP POLICY IF EXISTS "exams: package owner can create own exams" ON exams;
CREATE POLICY "exams: package owner can create own exams"
  ON exams FOR INSERT
  WITH CHECK (
    public.app_user_role() = 'school_user'
    AND public.app_user_school_id() = school_id
    AND public.has_active_school_management_package(school_id)
  );

DROP POLICY IF EXISTS "exams: package owner can delete own exams" ON exams;
CREATE POLICY "exams: package owner can delete own exams"
  ON exams FOR DELETE
  USING (
    public.app_user_role() = 'school_user'
    AND public.app_user_school_id() = school_id
    AND public.has_active_school_management_package(school_id)
  );

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'school-assets',
  'school-assets',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 2097152,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

DROP POLICY IF EXISTS "school-assets: public read" ON storage.objects;
CREATE POLICY "school-assets: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'school-assets');

DROP POLICY IF EXISTS "school-assets: admin can manage all" ON storage.objects;
CREATE POLICY "school-assets: admin can manage all"
  ON storage.objects FOR ALL
  USING (bucket_id = 'school-assets' AND public.app_user_role() = 'admin')
  WITH CHECK (bucket_id = 'school-assets' AND public.app_user_role() = 'admin');

DROP POLICY IF EXISTS "school-assets: package owner can upload own school assets" ON storage.objects;
CREATE POLICY "school-assets: package owner can upload own school assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'school-assets'
    AND public.app_user_role() = 'school_user'
    AND public.app_user_school_id()::TEXT = (storage.foldername(name))[1]
    AND public.has_active_school_management_package(public.app_user_school_id())
  );

DROP POLICY IF EXISTS "school-assets: package owner can update own school assets" ON storage.objects;
CREATE POLICY "school-assets: package owner can update own school assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'school-assets'
    AND public.app_user_role() = 'school_user'
    AND public.app_user_school_id()::TEXT = (storage.foldername(name))[1]
    AND public.has_active_school_management_package(public.app_user_school_id())
  )
  WITH CHECK (
    bucket_id = 'school-assets'
    AND public.app_user_role() = 'school_user'
    AND public.app_user_school_id()::TEXT = (storage.foldername(name))[1]
    AND public.has_active_school_management_package(public.app_user_school_id())
  );
