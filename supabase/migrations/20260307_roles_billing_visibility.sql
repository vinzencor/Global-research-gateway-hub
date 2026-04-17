-- Roles, billing lifecycle, invoice operations, and publication access modes
-- Safe to run multiple times where possible.

-- 1) Ensure subscriber role exists
insert into roles (name)
select 'subscriber'
where not exists (
  select 1 from roles where name = 'subscriber'
);

-- 2) Membership lifecycle columns (if not already present)
alter table memberships
  add column if not exists cancelled_at timestamptz,
  add column if not exists renewed_at timestamptz,
  add column if not exists suspended_at timestamptz,
  add column if not exists updated_at timestamptz default now();

-- Optional: normalize/expand allowed membership statuses
alter table memberships drop constraint if exists memberships_status_check;
alter table memberships
  add constraint memberships_status_check
  check (status in ('active', 'renewal_due', 'expired', 'cancelled', 'suspended'));

-- 3) Invoice status hardening
alter table invoices drop constraint if exists invoices_status_check;
alter table invoices
  add constraint invoices_status_check
  check (status in ('paid', 'unpaid', 'refunded', 'cancelled'));

-- 4) Publication visibility/access mode
alter table content_items
  add column if not exists access_mode text default 'open_access',
  add column if not exists visibility text default 'open_access';

alter table content_items drop constraint if exists content_items_access_mode_check;
alter table content_items
  add constraint content_items_access_mode_check
  check (access_mode in ('open_access', 'members_only', 'pay_per_view'));

alter table content_items drop constraint if exists content_items_visibility_check;
alter table content_items
  add constraint content_items_visibility_check
  check (visibility in ('open_access', 'members_only', 'pay_per_view'));

update content_items
set access_mode = coalesce(access_mode, 'open_access'),
    visibility = coalesce(visibility, access_mode, 'open_access');

-- 5) Pay-per-view entitlement table
create table if not exists pay_per_view_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  content_id uuid not null references content_items(id) on delete cascade,
  invoice_id uuid null references invoices(id) on delete set null,
  amount numeric(10,2) not null,
  currency text not null default 'USD',
  purchased_at timestamptz not null default now(),
  expires_at timestamptz null,
  unique(user_id, content_id)
);

create index if not exists idx_ppv_user_id on pay_per_view_purchases(user_id);
create index if not exists idx_ppv_content_id on pay_per_view_purchases(content_id);

-- 6) Admin audit trail for manual actions
create table if not exists payment_admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references profiles(id) on delete cascade,
  target_user_id uuid not null references profiles(id) on delete cascade,
  membership_id uuid null references memberships(id) on delete set null,
  invoice_id uuid null references invoices(id) on delete set null,
  action_type text not null,
  action_note text null,
  created_at timestamptz not null default now()
);

create index if not exists idx_payment_admin_actions_target on payment_admin_actions(target_user_id);
create index if not exists idx_payment_admin_actions_admin on payment_admin_actions(admin_user_id);
