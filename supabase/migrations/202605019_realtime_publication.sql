-- ============================================================
-- BursRadar Realtime publication
-- ============================================================
-- Enables Supabase Realtime change events for the tables the HTML
-- app listens to. RLS still controls what authenticated clients can read.

ALTER PUBLICATION supabase_realtime ADD TABLE public.schools;
ALTER PUBLICATION supabase_realtime ADD TABLE public.exams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.school_packages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.package_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_exam_marks;
