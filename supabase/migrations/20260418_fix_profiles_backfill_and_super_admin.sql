-- Fix missing profiles rows that break user_roles FK inserts.
-- This migration is safe to run multiple times.

begin;

-- 1) Backfill profile rows for any auth user missing in public.profiles
insert into public.profiles (id, full_name, institution)
select
  u.id,
  coalesce(
    nullif(u.raw_user_meta_data ->> 'full_name', ''),
    split_part(u.email, '@', 1)
  ) as full_name,
  nullif(u.raw_user_meta_data ->> 'institution', '') as institution
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

-- 2) Ensure new auth users automatically get a profile row
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, institution)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)),
    nullif(new.raw_user_meta_data ->> 'institution', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- 3) Ensure role exists
insert into public.roles (name)
values ('super_admin')
on conflict (name) do nothing;

-- 4) Grant super_admin to the target user email (now FK-safe)
insert into public.user_roles (user_id, role_id)
select
  u.id,
  r.id
from auth.users u
join public.roles r on r.name = 'super_admin'
where u.email = 'rahulpradeepan55@gmail.com'
on conflict do nothing;

commit;
