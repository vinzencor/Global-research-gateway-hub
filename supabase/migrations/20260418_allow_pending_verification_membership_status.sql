-- Allow pending verification status for memberships so signup/upgrade submissions can be stored.
-- Safe to run multiple times.

alter table public.memberships drop constraint if exists memberships_status_check;

alter table public.memberships
  add constraint memberships_status_check
  check (status in (
    'active',
    'renewal_due',
    'expired',
    'cancelled',
    'suspended',
    'pending_verification'
  ));
