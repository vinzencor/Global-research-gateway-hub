-- Feature flags for real users shown in public author listings
create table if not exists featured_users (
  user_id uuid primary key references profiles(id) on delete cascade,
  is_featured boolean not null default false,
  updated_at timestamptz not null default now()
);

create index if not exists idx_featured_users_is_featured on featured_users(is_featured);
