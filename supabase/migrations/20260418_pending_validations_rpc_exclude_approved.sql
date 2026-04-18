-- Ensure Validate New Users only returns users who are truly pending.
-- This replaces get_pending_validations_admin() to:
-- 1) return only the latest pending row per user
-- 2) exclude any user who already has an active/renewal_due membership

create or replace function public.get_pending_validations_admin()
returns table (
  membership_id uuid,
  user_id uuid,
  status text,
  plan_id uuid,
  created_at timestamptz,
  screenshot_url text,
  starts_at timestamptz,
  ends_at timestamptz,
  full_name text,
  institution text,
  email text,
  plan_name text,
  plan_price numeric,
  plan_billing_period text
)
language sql
security definer
set search_path = public
as $$
  with latest_pending as (
    select distinct on (m.user_id)
      m.id,
      m.user_id,
      m.status,
      m.plan_id,
      m.created_at,
      m.screenshot_url,
      m.starts_at,
      m.ends_at
    from public.memberships m
    where m.status in ('pending_verification', 'pending')
      and m.screenshot_url is not null
    order by m.user_id, m.created_at desc
  )
  select
    lp.id as membership_id,
    lp.user_id,
    lp.status,
    lp.plan_id,
    lp.created_at,
    lp.screenshot_url,
    lp.starts_at,
    lp.ends_at,
    p.full_name,
    p.institution,
    au.email,
    mp.name as plan_name,
    mp.price as plan_price,
    mp.billing_period as plan_billing_period
  from latest_pending lp
  left join public.profiles p on p.id = lp.user_id
  left join auth.users au on au.id = lp.user_id
  left join public.membership_plans mp on mp.id = lp.plan_id
  where not exists (
    select 1
    from public.memberships m2
    where m2.user_id = lp.user_id
      and m2.status in ('active', 'renewal_due')
  )
  order by lp.created_at desc;
$$;

grant execute on function public.get_pending_validations_admin() to authenticated;
