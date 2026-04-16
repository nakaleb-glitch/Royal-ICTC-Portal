ALTER TABLE public.teacher_schedule_covers
ADD COLUMN IF NOT EXISTS materials_link text;

DROP POLICY IF EXISTS "Original teachers can update cover materials" ON public.teacher_schedule_covers;
CREATE POLICY "Original teachers can update cover materials"
  ON public.teacher_schedule_covers
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.teacher_schedules ts
      WHERE ts.id = teacher_schedule_covers.base_schedule_id
        AND ts.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.teacher_schedules ts
      WHERE ts.id = teacher_schedule_covers.base_schedule_id
        AND ts.teacher_id = auth.uid()
    )
  );
