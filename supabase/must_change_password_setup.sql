-- Run once in Supabase SQL Editor.
-- Tracks whether a user still needs to change default password.

alter table public.users
add column if not exists must_change_password boolean not null default false;
