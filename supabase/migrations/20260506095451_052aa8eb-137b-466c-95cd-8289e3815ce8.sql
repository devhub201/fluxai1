CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE(user_id uuid, email text, display_name text, created_at timestamptz, roles text[])
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    au.id AS user_id,
    au.email::text AS email,
    p.display_name,
    au.created_at,
    COALESCE(array_agg(ur.role::text ORDER BY ur.role::text) FILTER (WHERE ur.role IS NOT NULL), ARRAY[]::text[]) AS roles
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.id = au.id
  LEFT JOIN public.user_roles ur ON ur.user_id = au.id
  WHERE public.is_admin()
  GROUP BY au.id, au.email, p.display_name, au.created_at
  ORDER BY au.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.admin_list_users() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;