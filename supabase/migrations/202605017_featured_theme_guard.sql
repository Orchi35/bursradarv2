CREATE OR REPLACE FUNCTION prevent_school_user_theme_write_without_featured()
RETURNS TRIGGER
AS $function$
BEGIN
  IF app_user_role() = 'school_user'
     AND NEW.hero_color IS DISTINCT FROM OLD.hero_color
     AND NOT has_active_featured_school_package(NEW.id) THEN
    RAISE EXCEPTION 'School users need an active featured_school package to change profile theme color.';
  END IF;

  RETURN NEW;
END;
$function$
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

DROP TRIGGER IF EXISTS trg_schools_prevent_school_user_theme_write_without_featured ON schools;
CREATE TRIGGER trg_schools_prevent_school_user_theme_write_without_featured
  BEFORE UPDATE ON schools
  FOR EACH ROW EXECUTE FUNCTION prevent_school_user_theme_write_without_featured();
