-- ============================================================
-- BursRadar Auth: Kullanıcı sınav planı
-- ============================================================
-- Supabase Dashboard -> SQL Editor içinde çalıştır.
-- Auth kullanıcılarının favori ve hatırlatma seçimlerini saklar.

CREATE TABLE IF NOT EXISTS user_exam_marks (
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id      TEXT        NOT NULL,
  is_favorite  BOOLEAN     NOT NULL DEFAULT false,
  has_reminder BOOLEAN     NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, exam_id),
  CHECK (is_favorite OR has_reminder)
);

CREATE INDEX IF NOT EXISTS user_exam_marks_user_idx ON user_exam_marks (user_id);
CREATE INDEX IF NOT EXISTS user_exam_marks_exam_idx ON user_exam_marks (exam_id);

CREATE OR REPLACE FUNCTION set_user_exam_marks_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_exam_marks_updated_at ON user_exam_marks;
CREATE TRIGGER trg_user_exam_marks_updated_at
  BEFORE UPDATE ON user_exam_marks
  FOR EACH ROW EXECUTE FUNCTION set_user_exam_marks_updated_at();

ALTER TABLE user_exam_marks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_exam_marks: kullanici kendi planini okuyabilir" ON user_exam_marks;
CREATE POLICY "user_exam_marks: kullanici kendi planini okuyabilir"
  ON user_exam_marks FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_exam_marks: kullanici kendi planina ekleyebilir" ON user_exam_marks;
CREATE POLICY "user_exam_marks: kullanici kendi planina ekleyebilir"
  ON user_exam_marks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_exam_marks: kullanici kendi planini guncelleyebilir" ON user_exam_marks;
CREATE POLICY "user_exam_marks: kullanici kendi planini guncelleyebilir"
  ON user_exam_marks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_exam_marks: kullanici kendi planindan silebilir" ON user_exam_marks;
CREATE POLICY "user_exam_marks: kullanici kendi planindan silebilir"
  ON user_exam_marks FOR DELETE
  USING (auth.uid() = user_id);
