-- ============================================================
-- BursRadar School Packages: admin approval workflow
-- ============================================================
-- Supabase Dashboard -> SQL Editor icinde calistir.
-- Talep olustu diye paket acilmaz; aktif paket sadece admin onayi ile olusur.

ALTER TABLE package_requests
  ADD COLUMN IF NOT EXISTS admin_note TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

ALTER TABLE school_packages
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE package_requests
SET status = 'pending'
WHERE status = 'contacted';

DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'package_requests'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%status%'
    AND pg_get_constraintdef(oid) LIKE '%pending%'
  LIMIT 1;

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE package_requests DROP CONSTRAINT %I', constraint_name);
  END IF;
END;
$$;

ALTER TABLE package_requests
  ADD CONSTRAINT package_requests_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'expired'));

CREATE OR REPLACE FUNCTION set_school_packages_updated_at()
RETURNS TRIGGER
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_school_packages_updated_at ON school_packages;
CREATE TRIGGER trg_school_packages_updated_at
  BEFORE UPDATE ON school_packages
  FOR EACH ROW EXECUTE FUNCTION set_school_packages_updated_at();

DROP FUNCTION IF EXISTS admin_approve_package_request(UUID, TEXT, TIMESTAMPTZ);
CREATE OR REPLACE FUNCTION admin_approve_package_request(
  target_request_id UUID,
  admin_note_value TEXT DEFAULT NULL,
  expires_at_value TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID
AS $function$
DECLARE
  request_row package_requests%ROWTYPE;
  package_id UUID;
BEGIN
  IF app_user_role() <> 'admin' THEN
    RAISE EXCEPTION 'Only admin can approve package requests.';
  END IF;

  SELECT * INTO request_row
  FROM package_requests
  WHERE id = target_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Package request not found.';
  END IF;

  IF request_row.status <> 'pending' THEN
    RAISE EXCEPTION 'Only pending requests can be approved.';
  END IF;

  UPDATE school_packages
  SET status = 'inactive'
  WHERE school_id = request_row.school_id
    AND package_type = request_row.package_type
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
    request_row.school_id,
    request_row.package_type,
    'active',
    request_row.price,
    auth.uid(),
    now(),
    expires_at_value
  )
  RETURNING id INTO package_id;

  UPDATE package_requests
  SET status = 'approved',
      admin_note = admin_note_value,
      reviewed_by = auth.uid(),
      reviewed_at = now()
  WHERE id = target_request_id;

  PERFORM sync_school_premium_flag(request_row.school_id);
  RETURN package_id;
END;
$function$
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

DROP FUNCTION IF EXISTS admin_reject_package_request(UUID, TEXT);
CREATE OR REPLACE FUNCTION admin_reject_package_request(
  target_request_id UUID,
  admin_note_value TEXT DEFAULT NULL
)
RETURNS UUID
AS $function$
DECLARE
  request_row package_requests%ROWTYPE;
BEGIN
  IF app_user_role() <> 'admin' THEN
    RAISE EXCEPTION 'Only admin can reject package requests.';
  END IF;

  SELECT * INTO request_row
  FROM package_requests
  WHERE id = target_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Package request not found.';
  END IF;

  IF request_row.status <> 'pending' THEN
    RAISE EXCEPTION 'Only pending requests can be rejected.';
  END IF;

  UPDATE package_requests
  SET status = 'rejected',
      admin_note = admin_note_value,
      reviewed_by = auth.uid(),
      reviewed_at = now()
  WHERE id = target_request_id;

  RETURN target_request_id;
END;
$function$
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

DROP FUNCTION IF EXISTS admin_deactivate_school_package(UUID, TEXT);
CREATE OR REPLACE FUNCTION admin_deactivate_school_package(
  target_package_id UUID,
  next_status TEXT DEFAULT 'inactive'
)
RETURNS UUID
AS $function$
DECLARE
  package_row school_packages%ROWTYPE;
BEGIN
  IF app_user_role() <> 'admin' THEN
    RAISE EXCEPTION 'Only admin can deactivate packages.';
  END IF;

  IF next_status NOT IN ('inactive', 'expired') THEN
    RAISE EXCEPTION 'next_status must be inactive or expired.';
  END IF;

  SELECT * INTO package_row
  FROM school_packages
  WHERE id = target_package_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'School package not found.';
  END IF;

  UPDATE school_packages
  SET status = next_status
  WHERE id = target_package_id;

  PERFORM sync_school_premium_flag(package_row.school_id);
  RETURN target_package_id;
END;
$function$
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;
