-- Fix: Allow students to read teacher information for their classes
-- This policy allows authenticated users to read user profiles that have the 'teacher' role
-- This is needed so students can see their teachers' names in the dashboard

CREATE POLICY "Authenticated users can read teacher profiles" ON public.users
FOR SELECT
TO authenticated
USING (role = 'teacher');

-- This policy is safe because:
-- 1. It only allows reading (SELECT), not updating or deleting
-- 2. It only exposes teacher profiles (role = 'teacher')
-- 3. Teachers are public figures in the school system and their names/emails should be visible to students
-- 4. This matches the existing pattern where students can already see teacher names in the admin dashboard