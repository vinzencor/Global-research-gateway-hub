-- Add FK relationship so Supabase/PostgREST can join memberships -> profiles
-- Safe migration: backfills profiles for auth users, then adds FK as NOT VALID.
-- This migration is idempotent and safe to run multiple times.

begin;

-- 1) Backfill missing profiles for users that already have memberships.
-- This prevents FK validation failures for known auth users.
insert into public.profiles (id, full_name, institution)
select
  u.id,
  coalesce(
    nullif(u.raw_user_meta_data ->> 'full_name', ''),
    split_part(u.email, '@', 1)
  ) as full_name,
  nullif(u.raw_user_meta_data ->> 'institution', '') as institution
from auth.users u
join public.memberships m on m.user_id = u.id
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

-- 2) Helpful index for FK lookups and joins.
create index if not exists idx_memberships_user_id on public.memberships(user_id);

-- 3) Add FK relation if missing.
-- Use NOT VALID first so existing historical rows do not block relation creation.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'memberships_user_id_profiles_fkey'
      and conrelid = 'public.memberships'::regclass
  ) then
    alter table public.memberships
      add constraint memberships_user_id_profiles_fkey
      foreign key (user_id)
      references public.profiles(id)
      on delete cascade
      not valid;
  end if;
end
$$;

-- 4) Try to validate; if legacy orphan rows exist, keep NOT VALID and continue.
do $$
begin
  begin
    alter table public.memberships validate constraint memberships_user_id_profiles_fkey;
  exception when others then
    raise notice 'memberships_user_id_profiles_fkey added but not validated yet (legacy rows may be orphaned).';
  end;
end
$$;

commit;
