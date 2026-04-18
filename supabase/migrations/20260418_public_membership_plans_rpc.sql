-- Public plan reader for signup page (works even if RLS blocks direct table reads).
-- Safe to run multiple times.

create or replace function public.get_public_membership_plans()
returns table (
  id uuid,
  name text,
  price numeric,
  description text,
  billing_period text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  has_description boolean;
  has_billing_period boolean;
  has_is_active boolean;
  table_has_rows boolean;
  sql_text text;
  insert_cols text;
  insert_sql text;
begin
  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'membership_plans' and column_name = 'description'
  ) into has_description;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'membership_plans' and column_name = 'billing_period'
  ) into has_billing_period;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'membership_plans' and column_name = 'is_active'
  ) into has_is_active;

  execute 'select exists(select 1 from public.membership_plans limit 1)' into table_has_rows;

  -- Auto-seed default plans for fresh environments.
  if not table_has_rows then
    insert_cols := 'name, price';
    if has_billing_period then
      insert_cols := insert_cols || ', billing_period';
    end if;
    if has_is_active then
      insert_cols := insert_cols || ', is_active';
    end if;

    insert_sql := 'insert into public.membership_plans (' || insert_cols || ') values ';

    if has_billing_period and has_is_active then
      insert_sql := insert_sql ||
        '(''Starter'', 10, ''monthly'', true), ' ||
        '(''Professional'', 20, ''monthly'', true), ' ||
        '(''Institutional'', 30, ''yearly'', true)';
    elsif has_billing_period and not has_is_active then
      insert_sql := insert_sql ||
        '(''Starter'', 10, ''monthly''), ' ||
        '(''Professional'', 20, ''monthly''), ' ||
        '(''Institutional'', 30, ''yearly'')';
    elsif not has_billing_period and has_is_active then
      insert_sql := insert_sql ||
        '(''Starter'', 10, true), ' ||
        '(''Professional'', 20, true), ' ||
        '(''Institutional'', 30, true)';
    else
      insert_sql := insert_sql ||
        '(''Starter'', 10), ' ||
        '(''Professional'', 20), ' ||
        '(''Institutional'', 30)';
    end if;

    begin
      execute insert_sql;
    exception when others then
      -- If insert fails due stricter schema constraints, continue without seeding.
      null;
    end;
  end if;

  sql_text := 'select mp.id, mp.name, mp.price';

  if has_description then
    sql_text := sql_text || ', mp.description';
  else
    sql_text := sql_text || ', null::text as description';
  end if;

  if has_billing_period then
    sql_text := sql_text || ', mp.billing_period';
  else
    sql_text := sql_text || ', null::text as billing_period';
  end if;

  sql_text := sql_text || ' from public.membership_plans mp';

  if has_is_active then
    sql_text := sql_text || ' where coalesce(mp.is_active, true) = true';
  end if;

  sql_text := sql_text || ' order by mp.price asc, mp.name asc';

  return query execute sql_text;
end;
$$;

grant execute on function public.get_public_membership_plans() to anon, authenticated;
