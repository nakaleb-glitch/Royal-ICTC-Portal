-- Break RLS recursion between teacher_schedules and teacher_schedule_covers:
-- the direct EXISTS(subquery on covers) in a schedules policy re-enters covers RLS,
-- which queries teacher_schedules again. Use SECURITY DEFINER + row_security off
-- for the existence check only.

DROP POLICY IF EXISTS "Cover teachers can read base schedule slots they cover" ON public.teacher_schedules;

CREATE OR REPLACE FUNCTION public.user_is_cover_for_schedule(p_schedule_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.teacher_schedule_covers c
    WHERE c.base_schedule_id = p_schedule_id
      AND c.cover_teacher_id = auth.uid()
  );
$$;

CREATE POLICY "Cover teachers can read base schedule slots they cover"
  ON public.teacher_schedules
  FOR SELECT
  TO authenticated
  USING (public.user_is_cover_for_schedule(id));
