ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS hero_color TEXT;

COMMENT ON COLUMN schools.hero_color IS
  'School profile hero background color. Stored as a hex color code.';

ALTER TABLE schools
  DROP CONSTRAINT IF EXISTS schools_hero_color_format_check;

ALTER TABLE schools
  ADD CONSTRAINT schools_hero_color_format_check
  CHECK (hero_color IS NULL OR hero_color ~ '^#[0-9A-Fa-f]{6}$');
