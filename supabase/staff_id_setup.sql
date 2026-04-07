-- Run this in Supabase SQL Editor before using Staff ID login/import.

alter table public.users
add column if not exists staff_id text;

-- Staff IDs should be unique regardless of case.
create unique index if not exists users_staff_id_unique_ci
on public.users (lower(staff_id))
where staff_id is not null;
