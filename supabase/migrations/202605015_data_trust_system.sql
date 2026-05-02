-- ============================================================
-- BursRadar Veri Guven Sistemi
-- ============================================================
-- Supabase Dashboard -> SQL Editor icinde calistir.
-- Auth, paket ve mevcut RLS modelini degistirmez.
-- Dogrulama alanlarini sadece admin yonetebilir.

ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'pending_review',
  ADD COLUMN IF NOT EXISTS verification_source TEXT NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verification_admin_note TEXT,
  ADD COLUMN IF NOT EXISTS registration_verification_status TEXT NOT NULL DEFAULT 'pending_review',
  ADD COLUMN IF NOT EXISTS registration_verification_source TEXT NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS registration_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS registration_last_checked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS registration_verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS registration_admin_note TEXT;

ALTER TABLE exams
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'pending_review',
  ADD COLUMN IF NOT EXISTS verification_source TEXT NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verification_admin_note TEXT;

ALTER TABLE schools
  DROP CONSTRAINT IF EXISTS schools_verification_status_check,
  ADD CONSTRAINT schools_verification_status_check
    CHECK (verification_status IN ('official_verified', 'pending_review', 'possibly_outdated')),
  DROP CONSTRAINT IF EXISTS schools_verification_source_check,
  ADD CONSTRAINT schools_verification_source_check
    CHECK (verification_source IN ('official_website', 'school_contact', 'social_media', 'manual_research', 'unknown')),
  DROP CONSTRAINT IF EXISTS schools_registration_verification_status_check,
  ADD CONSTRAINT schools_registration_verification_status_check
    CHECK (registration_verification_status IN ('official_verified', 'pending_review', 'possibly_outdated')),
  DROP CONSTRAINT IF EXISTS schools_registration_verification_source_check,
  ADD CONSTRAINT schools_registration_verification_source_check
    CHECK (registration_verification_source IN ('official_website', 'school_contact', 'social_media', 'manual_research', 'unknown'));

ALTER TABLE exams
  DROP CONSTRAINT IF EXISTS exams_verification_status_check,
  ADD CONSTRAINT exams_verification_status_check
    CHECK (verification_status IN ('official_verified', 'pending_review', 'possibly_outdated')),
  DROP CONSTRAINT IF EXISTS exams_verification_source_check,
  ADD CONSTRAINT exams_verification_source_check
    CHECK (verification_source IN ('official_website', 'school_contact', 'social_media', 'manual_research', 'unknown'));

CREATE OR REPLACE FUNCTION protect_school_trust_fields()
RETURNS TRIGGER
AS $function$
BEGIN
  IF public.app_user_role() = 'admin' THEN
    IF NEW.verification_status = 'official_verified' AND NEW.verified_at IS NULL THEN
      NEW.verified_at = now();
    END IF;
    IF NEW.registration_verification_status = 'official_verified' AND NEW.registration_verified_at IS NULL THEN
      NEW.registration_verified_at = now();
    END IF;
    NEW.verified_by = auth.uid();
    NEW.registration_verified_by = auth.uid();
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.verification_status = 'pending_review';
    NEW.verification_source = 'unknown';
    NEW.verified_at = NULL;
    NEW.last_checked_at = NULL;
    NEW.verified_by = NULL;
    NEW.verification_admin_note = NULL;
    NEW.registration_verification_status = 'pending_review';
    NEW.registration_verification_source = 'unknown';
    NEW.registration_verified_at = NULL;
    NEW.registration_last_checked_at = NULL;
    NEW.registration_verified_by = NULL;
    NEW.registration_admin_note = NULL;
  ELSE
    NEW.verification_status = OLD.verification_status;
    NEW.verification_source = OLD.verification_source;
    NEW.verified_at = OLD.verified_at;
    NEW.last_checked_at = OLD.last_checked_at;
    NEW.verified_by = OLD.verified_by;
    NEW.verification_admin_note = OLD.verification_admin_note;
    NEW.registration_verification_status = OLD.registration_verification_status;
    NEW.registration_verification_source = OLD.registration_verification_source;
    NEW.registration_verified_at = OLD.registration_verified_at;
    NEW.registration_last_checked_at = OLD.registration_last_checked_at;
    NEW.registration_verified_by = OLD.registration_verified_by;
    NEW.registration_admin_note = OLD.registration_admin_note;
  END IF;

  RETURN NEW;
END;
$function$
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

DROP TRIGGER IF EXISTS trg_protect_school_trust_fields ON schools;
CREATE TRIGGER trg_protect_school_trust_fields
  BEFORE INSERT OR UPDATE ON schools
  FOR EACH ROW EXECUTE FUNCTION protect_school_trust_fields();

CREATE OR REPLACE FUNCTION protect_exam_trust_fields()
RETURNS TRIGGER
AS $function$
BEGIN
  IF public.app_user_role() = 'admin' THEN
    IF NEW.verification_status = 'official_verified' AND NEW.verified_at IS NULL THEN
      NEW.verified_at = now();
    END IF;
    NEW.verified_by = auth.uid();
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.verification_status = 'pending_review';
    NEW.verification_source = 'unknown';
    NEW.verified_at = NULL;
    NEW.last_checked_at = NULL;
    NEW.verified_by = NULL;
    NEW.verification_admin_note = NULL;
  ELSE
    NEW.verification_status = OLD.verification_status;
    NEW.verification_source = OLD.verification_source;
    NEW.verified_at = OLD.verified_at;
    NEW.last_checked_at = OLD.last_checked_at;
    NEW.verified_by = OLD.verified_by;
    NEW.verification_admin_note = OLD.verification_admin_note;
  END IF;

  RETURN NEW;
END;
$function$
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

DROP TRIGGER IF EXISTS trg_protect_exam_trust_fields ON exams;
CREATE TRIGGER trg_protect_exam_trust_fields
  BEFORE INSERT OR UPDATE ON exams
  FOR EACH ROW EXECUTE FUNCTION protect_exam_trust_fields();
