-- ============================================================
-- BursRadar Super Admin Controls
-- ============================================================
-- Supabase Dashboard -> SQL Editor icinde calistir.
-- Admin kullanicisi sistemdeki en yuksek yetkidir.

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS is_restricted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS restriction_note TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION set_user_profiles_updated_at()
RETURNS TRIGGER
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION set_user_profiles_updated_at();

DROP POLICY IF EXISTS "schools: admin can update all schools" ON schools;
DROP POLICY IF EXISTS "schools: admin can insert schools" ON schools;
DROP POLICY IF EXISTS "schools: admin can manage all schools" ON schools;
CREATE POLICY "schools: admin can manage all schools"
  ON schools FOR ALL
  USING (app_user_role() = 'admin')
  WITH CHECK (app_user_role() = 'admin');

DROP POLICY IF EXISTS "exams: admin can manage all exams" ON exams;
CREATE POLICY "exams: admin can manage all exams"
  ON exams FOR ALL
  USING (app_user_role() = 'admin')
  WITH CHECK (app_user_role() = 'admin');

DROP POLICY IF EXISTS "user_exam_marks: admin can read all" ON user_exam_marks;
DROP POLICY IF EXISTS "user_exam_marks: admin can manage all" ON user_exam_marks;
CREATE POLICY "user_exam_marks: admin can manage all"
  ON user_exam_marks FOR ALL
  USING (app_user_role() = 'admin')
  WITH CHECK (app_user_role() = 'admin');

DROP POLICY IF EXISTS "package_requests: admin can update" ON package_requests;
DROP POLICY IF EXISTS "package_requests: admin can manage all" ON package_requests;
CREATE POLICY "package_requests: admin can manage all"
  ON package_requests FOR ALL
  USING (app_user_role() = 'admin')
  WITH CHECK (app_user_role() = 'admin');

DROP FUNCTION IF EXISTS admin_list_user_profiles();
CREATE OR REPLACE FUNCTION admin_list_user_profiles()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  email TEXT,
  role TEXT,
  school_id UUID,
  school_name TEXT,
  is_restricted BOOLEAN,
  restriction_note TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
AS $function$
BEGIN
  IF app_user_role() <> 'admin' THEN
    RAISE EXCEPTION 'Only admin can list user profiles.';
  END IF;

  RETURN QUERY
    SELECT
      up.id,
      up.user_id,
      au.email::TEXT,
      up.role,
      up.school_id,
      s.name::TEXT AS school_name,
      up.is_restricted,
      up.restriction_note,
      up.created_at,
      up.updated_at
    FROM user_profiles up
    LEFT JOIN auth.users au ON au.id = up.user_id
    LEFT JOIN schools s ON s.id = up.school_id
    ORDER BY up.created_at DESC;
END;
$function$
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth;

DROP FUNCTION IF EXISTS admin_assign_school_package(UUID, TEXT, INTEGER, TIMESTAMPTZ);
CREATE OR REPLACE FUNCTION admin_assign_school_package(
  target_school_id UUID,
  target_package_type TEXT,
  package_price INTEGER,
  expires_at_value TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID
AS $function$
DECLARE
  package_id UUID;
BEGIN
  IF app_user_role() <> 'admin' THEN
    RAISE EXCEPTION 'Only admin can assign packages.';
  END IF;

  IF target_package_type NOT IN ('profile_management', 'featured_school') THEN
    RAISE EXCEPTION 'Invalid package type.';
  END IF;

  UPDATE school_packages
  SET status = 'inactive'
  WHERE school_id = target_school_id
    AND package_type = target_package_type
    AND status = 'active';

  INSERT INTO school_packages (
    school_id,
    package_type,
    status,
    price,
    approved_by,
    started_at,
    expires_at
  )
  VALUES (
    target_school_id,
    target_package_type,
    'active',
    package_price,
    auth.uid(),
    now(),
    expires_at_value
  )
  RETURNING id INTO package_id;

  PERFORM sync_school_premium_flag(target_school_id);
  RETURN package_id;
END;
$function$
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

DROP FUNCTION IF EXISTS admin_update_school_package_expiry(UUID, TIMESTAMPTZ);
CREATE OR REPLACE FUNCTION admin_update_school_package_expiry(
  target_package_id UUID,
  expires_at_value TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID
AS $function$
DECLARE
  package_row school_packages%ROWTYPE;
BEGIN
  IF app_user_role() <> 'admin' THEN
    RAISE EXCEPTION 'Only admin can update package expiry.';
  END IF;

  SELECT * INTO package_row
  FROM school_packages
  WHERE id = target_package_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'School package not found.';
  END IF;

  UPDATE school_packages
  SET expires_at = expires_at_value
  WHERE id = target_package_id;

  PERFORM sync_school_premium_flag(package_row.school_id);
  RETURN target_package_id;
END;
$function$
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

DROP FUNCTION IF EXISTS admin_restrict_user_profile(UUID, BOOLEAN, TEXT);
CREATE OR REPLACE FUNCTION admin_restrict_user_profile(
  target_profile_user_id UUID,
  restricted_value BOOLEAN,
  restriction_note_value TEXT DEFAULT NULL
)
RETURNS UUID
AS $function$
BEGIN
  IF app_user_role() <> 'admin' THEN
    RAISE EXCEPTION 'Only admin can restrict users.';
  END IF;

  UPDATE user_profiles
  SET is_restricted = restricted_value,
      restriction_note = restriction_note_value
  WHERE user_id = target_profile_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found.';
  END IF;

  RETURN target_profile_user_id;
END;
$function$
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;
