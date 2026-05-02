-- ============================================================
-- BursRadar Admin User Role Management
-- ============================================================
-- Admin can find a registered auth user by email and update the
-- persistent public.user_profiles role/school_id mapping.

DROP FUNCTION IF EXISTS admin_find_user_profile_by_email(TEXT);
CREATE OR REPLACE FUNCTION admin_find_user_profile_by_email(search_email TEXT)
RETURNS TABLE (
  profile_user_id UUID,
  email TEXT,
  role TEXT,
  school_id UUID,
  school_name TEXT,
  is_restricted BOOLEAN,
  restriction_note TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
AS '
BEGIN
  IF public.app_user_role() <> ''admin'' THEN
    RAISE EXCEPTION ''Only admin can search user profiles.'';
  END IF;

  IF search_email IS NULL OR btrim(search_email) = '''' THEN
    RAISE EXCEPTION ''Email is required.'';
  END IF;

  RETURN QUERY
    SELECT
      auth_user.id AS profile_user_id,
      auth_user.email::TEXT AS email,
      COALESCE(profile.role, ''user'')::TEXT AS role,
      profile.school_id AS school_id,
      school.name::TEXT AS school_name,
      COALESCE(profile.is_restricted, false) AS is_restricted,
      profile.restriction_note AS restriction_note,
      profile.created_at AS created_at,
      profile.updated_at AS updated_at
    FROM auth.users AS auth_user
    LEFT JOIN public.user_profiles AS profile ON profile.user_id = auth_user.id
    LEFT JOIN public.schools AS school ON school.id = profile.school_id
    WHERE lower(auth_user.email) = lower(btrim(search_email))
    LIMIT 1;
END;
'
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth;

DROP FUNCTION IF EXISTS admin_update_user_role_by_email(TEXT, TEXT, UUID);
CREATE OR REPLACE FUNCTION admin_update_user_role_by_email(
  target_email TEXT,
  target_role TEXT,
  target_school_id UUID DEFAULT NULL
)
RETURNS TABLE (
  profile_user_id UUID,
  email TEXT,
  role TEXT,
  school_id UUID,
  school_name TEXT,
  is_restricted BOOLEAN,
  restriction_note TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
AS '
DECLARE
  found_user_id UUID;
  normalized_role TEXT;
  next_school_id UUID;
BEGIN
  IF public.app_user_role() <> ''admin'' THEN
    RAISE EXCEPTION ''Only admin can update user roles.'';
  END IF;

  IF target_email IS NULL OR btrim(target_email) = '''' THEN
    RAISE EXCEPTION ''Email is required.'';
  END IF;

  normalized_role := btrim(target_role);
  IF normalized_role NOT IN (''user'', ''school_user'', ''admin'') THEN
    RAISE EXCEPTION ''Invalid role.'';
  END IF;

  SELECT au.id INTO found_user_id
  FROM auth.users au
  WHERE lower(au.email) = lower(btrim(target_email))
  LIMIT 1;

  IF found_user_id IS NULL THEN
    RAISE EXCEPTION ''User not found.'';
  END IF;

  IF found_user_id = auth.uid() AND normalized_role <> ''admin'' THEN
    RAISE EXCEPTION ''Admin cannot remove their own admin role.'';
  END IF;

  IF normalized_role = ''school_user'' THEN
    IF target_school_id IS NULL THEN
      RAISE EXCEPTION ''school_id is required for school_user role.'';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.schools WHERE id = target_school_id) THEN
      RAISE EXCEPTION ''School not found.'';
    END IF;

    next_school_id := target_school_id;
  ELSE
    next_school_id := NULL;
  END IF;

  INSERT INTO public.user_profiles (user_id, role, school_id)
  VALUES (found_user_id, normalized_role, next_school_id)
  ON CONFLICT (user_id) DO UPDATE
    SET role = EXCLUDED.role,
        school_id = EXCLUDED.school_id
  WHERE public.user_profiles.user_id = found_user_id;

  RETURN QUERY
    SELECT
      auth_user.id AS profile_user_id,
      auth_user.email::TEXT AS email,
      profile.role AS role,
      profile.school_id AS school_id,
      school.name::TEXT AS school_name,
      profile.is_restricted AS is_restricted,
      profile.restriction_note AS restriction_note,
      profile.created_at AS created_at,
      profile.updated_at AS updated_at
    FROM auth.users AS auth_user
    JOIN public.user_profiles AS profile ON profile.user_id = auth_user.id
    LEFT JOIN public.schools AS school ON school.id = profile.school_id
    WHERE auth_user.id = found_user_id
    LIMIT 1;
END;
'
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth;
