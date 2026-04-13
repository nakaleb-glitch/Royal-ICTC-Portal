-- Fix all RLS admin policies to include admin_teacher role

-- This manual fix avoids the dynamic policy creation error

-- Drop the previous broken migration attempt (we will recreate them correctly)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'students' AND schemaname = 'public') THEN
        DROP POLICY IF EXISTS "Admins can manage students" ON public.students;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'classes' AND schemaname = 'public') THEN
        DROP POLICY IF EXISTS "Admins can manage classes" ON public.classes;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'users' AND schemaname = 'public') THEN
        DROP POLICY IF EXISTS "Admins can manage users" ON public.users;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'assignments' AND schemaname = 'public') THEN
        DROP POLICY IF EXISTS "Admins can manage assignments" ON public.assignments;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'events_deadlines' AND schemaname = 'public') THEN
        DROP POLICY IF EXISTS "Admins can manage events" ON public.events_deadlines;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'resources' AND schemaname = 'public') THEN
        DROP POLICY IF EXISTS "Admins can manage resources" ON public.resources;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'resource_bookings' AND schemaname = 'public') THEN
        DROP POLICY IF EXISTS "Admins can manage resource bookings" ON public.resource_bookings;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'behavior_reports' AND schemaname = 'public') THEN
        DROP POLICY IF EXISTS "Admins can manage behavior reports" ON public.behavior_reports;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'term_comments' AND schemaname = 'public') THEN
        DROP POLICY IF EXISTS "Admins can manage gradebooks" ON public.term_comments;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'weekly_plans' AND schemaname = 'public') THEN
        DROP POLICY IF EXISTS "Admins can manage weekly plans" ON public.weekly_plans;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'teacher_schedules' AND schemaname = 'public') THEN
        DROP POLICY IF EXISTS "Admins can view teacher schedules" ON public.teacher_schedules;
    END IF;
END $$;

-- Recreate each policy correctly
CREATE POLICY "Admins can manage students" ON public.students
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'admin_teacher')
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'admin_teacher')
        )
    );

CREATE POLICY "Admins can manage classes" ON public.classes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'admin_teacher')
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'admin_teacher')
        )
    );

CREATE POLICY "Admins can manage users" ON public.users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'admin_teacher')
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'admin_teacher')
        )
    );

CREATE POLICY "Admins can manage assignments" ON public.assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'admin_teacher')
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'admin_teacher')
        )
    );

CREATE POLICY "Admins can manage events" ON public.events_deadlines
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'admin_teacher')
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'admin_teacher')
        )
    );

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'resources' AND schemaname = 'public') THEN
        CREATE POLICY "Admins can manage resources" ON public.resources
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE users.id = auth.uid() 
                    AND users.role IN ('admin', 'admin_teacher')
                )
            ) WITH CHECK (
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE users.id = auth.uid() 
                    AND users.role IN ('admin', 'admin_teacher')
                )
            );
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'resource_bookings' AND schemaname = 'public') THEN
        CREATE POLICY "Admins can manage resource bookings" ON public.resource_bookings
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE users.id = auth.uid() 
                    AND users.role IN ('admin', 'admin_teacher')
                )
            ) WITH CHECK (
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE users.id = auth.uid() 
                    AND users.role IN ('admin', 'admin_teacher')
                )
            );
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'behavior_reports' AND schemaname = 'public') THEN
        CREATE POLICY "Admins can manage behavior reports" ON public.behavior_reports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'admin_teacher')
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'admin_teacher')
        )
    );

CREATE POLICY "Admins can manage gradebooks" ON public.term_comments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'admin_teacher')
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'admin_teacher')
        )
    );

CREATE POLICY "Admins can manage weekly plans" ON public.weekly_plans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'admin_teacher')
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'admin_teacher')
        )
    );

CREATE POLICY "Admins can view teacher schedules" ON public.teacher_schedules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'admin_teacher')
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'admin_teacher')
        )
    );