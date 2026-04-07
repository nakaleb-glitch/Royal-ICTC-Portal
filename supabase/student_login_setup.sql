alter table public.users
add column if not exists student_id_ref uuid references public.students(id) on delete set null;

create unique index if not exists users_student_id_ref_unique
on public.users (student_id_ref)
where student_id_ref is not null;
