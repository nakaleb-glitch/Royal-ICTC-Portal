-- Allows pre-login Staff ID -> email lookup while keeping RLS on users table.
-- Run once in Supabase SQL Editor.

create or replace function public.get_email_by_staff_id(p_staff_id text)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select u.email
  from public.users u
  where lower(u.staff_id) = lower(trim(p_staff_id))
  limit 1;
$$;

revoke all on function public.get_email_by_staff_id(text) from public;
grant execute on function public.get_email_by_staff_id(text) to anon, authenticated;
