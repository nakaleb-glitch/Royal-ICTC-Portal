-- Allow cover teachers to read master schedule rows for slots they cover so
-- PostgREST can embed base_schedule on teacher_schedule_covers for them.
DROP POLICY IF EXISTS "Cover teachers can read base schedule slots they cover" ON public.teacher_schedules;
CREATE POLICY "Cover teachers can read base schedule slots they cover"
  ON public.teacher_schedules
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.teacher_schedule_covers c
      WHERE c.base_schedule_id = teacher_schedules.id
        AND c.cover_teacher_id = auth.uid()
    )
  );
