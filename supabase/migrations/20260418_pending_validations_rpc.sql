-- Fetch pending membership validations for admin UI with SECURITY DEFINER.
-- Avoids RLS visibility issues for regular client queries.
-- Safe to run multiple times.

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
  select
    m.id as membership_id,
    m.user_id,
    m.status,
    m.plan_id,
    m.created_at,
    m.screenshot_url,
    m.starts_at,
    m.ends_at,
    p.full_name,
    p.institution,
    au.email,
    mp.name as plan_name,
    mp.price as plan_price,
    mp.billing_period as plan_billing_period
  from public.memberships m
  left join public.profiles p on p.id = m.user_id
  left join auth.users au on au.id = m.user_id
  left join public.membership_plans mp on mp.id = m.plan_id
  where m.status in ('pending_verification', 'pending')
  order by m.created_at desc;
$$;

grant execute on function public.get_pending_validations_admin() to authenticated;
