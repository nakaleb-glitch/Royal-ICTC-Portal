-- Student read access for student dashboard gradebook view
-- Safe to run multiple times

alter table public.assignments enable row level security;
alter table public.participation_grades enable row level security;
alter table public.assignment_grades enable row level security;
alter table public.progress_test_grades enable row level security;

drop policy if exists "Students can read own class assignments" on public.assignments;
create policy "Students can read own class assignments"
on public.assignments
for select
to authenticated
using (
  exists (
    select 1
    from public.users u
    join public.class_students cs
      on cs.student_id = u.student_id_ref
    where u.id = auth.uid()
      and u.role = 'student'
      and cs.class_id = assignments.class_id
  )
);

drop policy if exists "Students can read own participation grades" on public.participation_grades;
create policy "Students can read own participation grades"
on public.participation_grades
for select
to authenticated
using (
  exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role = 'student'
      and u.student_id_ref = participation_grades.student_id
  )
);

drop policy if exists "Students can read own assignment grades" on public.assignment_grades;
create policy "Students can read own assignment grades"
on public.assignment_grades
for select
to authenticated
using (
  exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role = 'student'
      and u.student_id_ref = assignment_grades.student_id
  )
);

drop policy if exists "Students can read own progress test grades" on public.progress_test_grades;
create policy "Students can read own progress test grades"
on public.progress_test_grades
for select
to authenticated
using (
  exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role = 'student'
      and u.student_id_ref = progress_test_grades.student_id
  )
);
