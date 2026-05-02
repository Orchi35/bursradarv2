-- ============================================================
-- BursRadar School Packages: roles, package status, requests
-- ============================================================
-- Supabase Dashboard -> SQL Editor icinde calistir.
-- Okul kullanicilarinin sadece kendi okul paketlerini ve taleplerini
-- yonetebilmesi icin role-based access control ve RLS kurar.

CREATE TABLE IF NOT EXISTS user_profiles (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT        NOT NULL DEFAULT 'user'
              CHECK (role IN ('user', 'school_user', 'admin')),
  school_id  UUID        REFERENCES schools(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (role <> 'school_user' OR school_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS user_profiles_user_idx ON user_profiles (user_id);
CREATE INDEX IF NOT EXISTS user_profiles_role_idx ON user_profiles (role);
CREATE INDEX IF NOT EXISTS user_profiles_school_idx ON user_profiles (school_id);

CREATE TABLE IF NOT EXISTS school_packages (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id    UUID        NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  package_type TEXT        NOT NULL
                 CHECK (package_type IN ('profile_management', 'featured_school')),
  status       TEXT        NOT NULL DEFAULT 'inactive'
                 CHECK (status IN ('inactive', 'pending', 'active', 'expired')),
  price        INTEGER     NOT NULL CHECK (price >= 0),
  started_at   TIMESTAMPTZ,
  expires_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS school_packages_school_idx ON school_packages (school_id);
CREATE INDEX IF NOT EXISTS school_packages_status_idx ON school_packages (status);
CREATE INDEX IF NOT EXISTS school_packages_active_idx
  ON school_packages (school_id, package_type)
  WHERE status = 'active';

CREATE TABLE IF NOT EXISTS package_requests (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id    UUID        NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  user_id      UUID        NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  package_type TEXT        NOT NULL
                 CHECK (package_type IN ('profile_management', 'featured_school')),
  price        INTEGER     NOT NULL CHECK (price >= 0),
  status       TEXT        NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'contacted', 'approved', 'rejected')),
  note         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS package_requests_school_idx ON package_requests (school_id);
CREATE INDEX IF NOT EXISTS package_requests_user_idx ON package_requests (user_id);
CREATE INDEX IF NOT EXISTS package_requests_status_idx ON package_requests (status);

CREATE OR REPLACE FUNCTION app_user_role()
RETURNS TEXT
AS $function$
  SELECT role FROM user_profiles WHERE user_id = auth.uid() LIMIT 1;
$function$
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public;

CREATE OR REPLACE FUNCTION app_user_school_id()
RETURNS UUID
AS $function$
  SELECT school_id FROM user_profiles WHERE user_id = auth.uid() LIMIT 1;
$function$
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public;

CREATE OR REPLACE FUNCTION has_active_school_management_package(target_school_id UUID)
RETURNS BOOLEAN
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM school_packages
    WHERE school_id = target_school_id
      AND status = 'active'
      AND package_type IN ('profile_management', 'featured_school')
      AND (expires_at IS NULL OR expires_at > now())
  );
$function$
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public;

CREATE OR REPLACE FUNCTION has_active_featured_school_package(target_school_id UUID)
RETURNS BOOLEAN
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM school_packages
    WHERE school_id = target_school_id
      AND status = 'active'
      AND package_type = 'featured_school'
      AND (expires_at IS NULL OR expires_at > now())
  );
$function$
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public;

CREATE OR REPLACE FUNCTION sync_school_premium_flag(target_school_id UUID)
RETURNS VOID
AS $function$
BEGIN
  UPDATE schools
  SET is_premium = has_active_featured_school_package(target_school_id)
  WHERE id = target_school_id;
END;
$function$
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

CREATE OR REPLACE FUNCTION sync_school_premium_flag_trigger()
RETURNS TRIGGER
AS $function$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM sync_school_premium_flag(OLD.school_id);
    RETURN OLD;
  END IF;

  PERFORM sync_school_premium_flag(NEW.school_id);
  IF TG_OP = 'UPDATE' AND OLD.school_id IS DISTINCT FROM NEW.school_id THEN
    PERFORM sync_school_premium_flag(OLD.school_id);
  END IF;
  RETURN NEW;
END;
$function$
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

DROP TRIGGER IF EXISTS trg_school_packages_sync_premium ON school_packages;
CREATE TRIGGER trg_school_packages_sync_premium
  AFTER INSERT OR UPDATE OR DELETE ON school_packages
  FOR EACH ROW EXECUTE FUNCTION sync_school_premium_flag_trigger();

CREATE OR REPLACE FUNCTION prevent_school_user_premium_write()
RETURNS TRIGGER
AS $function$
BEGIN
  IF app_user_role() = 'school_user'
     AND NEW.is_premium IS DISTINCT FROM OLD.is_premium THEN
    RAISE EXCEPTION 'School users cannot change premium status directly.';
  END IF;

  RETURN NEW;
END;
$function$
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

DROP TRIGGER IF EXISTS trg_schools_prevent_school_user_premium_write ON schools;
CREATE TRIGGER trg_schools_prevent_school_user_premium_write
  BEFORE UPDATE ON schools
  FOR EACH ROW EXECUTE FUNCTION prevent_school_user_premium_write();

UPDATE schools
SET is_premium = has_active_featured_school_package(id);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_profiles: user or admin can read" ON user_profiles;
CREATE POLICY "user_profiles: user or admin can read"
  ON user_profiles FOR SELECT
  USING (user_id = auth.uid() OR app_user_role() = 'admin');

DROP POLICY IF EXISTS "user_profiles: admin can manage" ON user_profiles;
CREATE POLICY "user_profiles: admin can manage"
  ON user_profiles FOR ALL
  USING (app_user_role() = 'admin')
  WITH CHECK (app_user_role() = 'admin');

DROP POLICY IF EXISTS "school_packages: school owner or admin can read" ON school_packages;
CREATE POLICY "school_packages: school owner or admin can read"
  ON school_packages FOR SELECT
  USING (
    app_user_role() = 'admin'
    OR (app_user_role() = 'school_user' AND app_user_school_id() = school_id)
  );

DROP POLICY IF EXISTS "school_packages: admin can manage" ON school_packages;
CREATE POLICY "school_packages: admin can manage"
  ON school_packages FOR ALL
  USING (app_user_role() = 'admin')
  WITH CHECK (app_user_role() = 'admin');

DROP POLICY IF EXISTS "package_requests: requester or admin can read" ON package_requests;
CREATE POLICY "package_requests: requester or admin can read"
  ON package_requests FOR SELECT
  USING (user_id = auth.uid() OR app_user_role() = 'admin');

DROP POLICY IF EXISTS "package_requests: school owner can create" ON package_requests;
CREATE POLICY "package_requests: school owner can create"
  ON package_requests FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND app_user_role() = 'school_user'
    AND app_user_school_id() = school_id
  );

DROP POLICY IF EXISTS "package_requests: admin can update" ON package_requests;
CREATE POLICY "package_requests: admin can update"
  ON package_requests FOR UPDATE
  USING (app_user_role() = 'admin')
  WITH CHECK (app_user_role() = 'admin');

-- Profil yonetimi satin alindiginda okul kendi temel kaydini guncelleyebilir.
DROP POLICY IF EXISTS "schools: package owner can update own school" ON schools;
CREATE POLICY "schools: package owner can update own school"
  ON schools FOR UPDATE
  USING (
    app_user_role() = 'school_user'
    AND app_user_school_id() = id
    AND has_active_school_management_package(id)
  )
  WITH CHECK (
    app_user_role() = 'school_user'
    AND app_user_school_id() = id
    AND has_active_school_management_package(id)
  );

DROP POLICY IF EXISTS "exams: package owner can update own exams" ON exams;
CREATE POLICY "exams: package owner can update own exams"
  ON exams FOR UPDATE
  USING (
    app_user_role() = 'school_user'
    AND app_user_school_id() = school_id
    AND has_active_school_management_package(school_id)
  )
  WITH CHECK (
    app_user_role() = 'school_user'
    AND app_user_school_id() = school_id
    AND has_active_school_management_package(school_id)
  );
