-- Manual one-time approval repair for user:
-- email: rahulpradeepan99@gmail.com
-- user_id: 34778385-8c57-4539-841e-aa425bae7287

begin;

-- 1) Ensure profile exists for FK integrity.
insert into public.profiles (id, full_name)
select u.id, coalesce(nullif(u.raw_user_meta_data ->> 'full_name', ''), split_part(u.email, '@', 1))
from auth.users u
where u.id = '34778385-8c57-4539-841e-aa425bae7287'::uuid
  and not exists (
    select 1 from public.profiles p where p.id = u.id
  )
on conflict (id) do nothing;

-- 2) Pick latest pending membership row for this user.
with latest_pending as (
  select m.id, m.plan_id
  from public.memberships m
  where m.user_id = '34778385-8c57-4539-841e-aa425bae7287'::uuid
    and m.status in ('pending_verification', 'pending')
  order by m.created_at desc
  limit 1
),
plan_period as (
  select
    lp.id as membership_id,
    coalesce(mp.billing_period, 'yearly') as billing_period,
    coalesce(mp.price, 0) as plan_price
  from latest_pending lp
  left join public.membership_plans mp on mp.id = lp.plan_id
)
-- 3) Cancel all other pending/active rows for this user.
update public.memberships m
set status = 'cancelled',
    ends_at = now()
where m.user_id = '34778385-8c57-4539-841e-aa425bae7287'::uuid
  and m.id <> (select membership_id from plan_period)
  and m.status in ('active', 'renewal_due', 'pending_verification', 'pending');

-- 4) Activate latest pending row.
with latest_pending as (
  select m.id, m.plan_id
  from public.memberships m
  where m.user_id = '34778385-8c57-4539-841e-aa425bae7287'::uuid
    and m.status in ('pending_verification', 'pending')
  order by m.created_at desc
  limit 1
),
plan_period as (
  select
    lp.id as membership_id,
    coalesce(mp.billing_period, 'yearly') as billing_period,
    coalesce(mp.price, 0) as plan_price
  from latest_pending lp
  left join public.membership_plans mp on mp.id = lp.plan_id
)
update public.memberships m
set status = 'active',
    starts_at = now(),
    ends_at = case
      when (select billing_period from plan_period) = 'monthly' then now() + interval '1 month'
      else now() + interval '1 year'
    end
where m.id = (select membership_id from plan_period);

-- 5) Ensure member role exists.
insert into public.user_roles (user_id, role_id)
select
  '34778385-8c57-4539-841e-aa425bae7287'::uuid,
  r.id
from public.roles r
where r.name = 'member'
on conflict do nothing;

-- 6) Add paid invoice for audit (if active membership exists).
with active_mem as (
  select m.id, m.plan_id
  from public.memberships m
  where m.user_id = '34778385-8c57-4539-841e-aa425bae7287'::uuid
    and m.status in ('active', 'renewal_due')
  order by m.created_at desc
  limit 1
)
insert into public.invoices (user_id, membership_id, amount, currency, status, paid_at)
select
  '34778385-8c57-4539-841e-aa425bae7287'::uuid,
  am.id,
  coalesce(mp.price, 0),
  'USD',
  'paid',
  now()
from active_mem am
left join public.membership_plans mp on mp.id = am.plan_id;

commit;
