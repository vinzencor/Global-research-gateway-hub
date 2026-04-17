-- Run this in the Supabase SQL Editor to enable email display in Admin Users & Roles
-- Go to: Supabase Dashboard → SQL Editor → New Query → paste this → Run

CREATE OR REPLACE FUNCTION get_all_user_emails()
RETURNS TABLE (id uuid, email text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, email FROM auth.users;
$$;

-- Grant execute to the anon and authenticated roles so the frontend can call it
GRANT EXECUTE ON FUNCTION get_all_user_emails() TO anon, authenticated;
