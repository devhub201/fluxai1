CREATE OR REPLACE FUNCTION public.admin_set_staff_role(_email text, _enabled boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  clean_email text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  clean_email := lower(trim(coalesce(_email, '')));
  IF clean_email = '' OR position('@' in clean_email) = 0 THEN
    RAISE EXCEPTION 'valid email required';
  END IF;
  SELECT id INTO uid FROM auth.users WHERE lower(email) = clean_email LIMIT 1;
  IF uid IS NULL THEN
    RAISE EXCEPTION 'user not found';
  END IF;
  IF _enabled THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (uid, 'staff'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    DELETE FROM public.user_roles
    WHERE user_id = uid AND role = 'staff'::public.app_role;
  END IF;
  RETURN jsonb_build_object('user_id', uid, 'email', clean_email, 'staff', _enabled);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_staff()
RETURNS TABLE(user_id uuid, email text, display_name text, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ur.user_id, au.email::text, p.display_name, ur.created_at
  FROM public.user_roles ur
  LEFT JOIN auth.users au ON au.id = ur.user_id
  LEFT JOIN public.profiles p ON p.id = ur.user_id
  WHERE public.is_admin()
    AND ur.role = 'staff'::public.app_role
  ORDER BY ur.created_at DESC;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'moderation_flags' AND policyname = 'flags_staff_select'
  ) THEN
    CREATE POLICY flags_staff_select
    ON public.moderation_flags
    FOR SELECT
    TO authenticated
    USING (public.is_staff());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'moderation_flags' AND policyname = 'flags_staff_update'
  ) THEN
    CREATE POLICY flags_staff_update
    ON public.moderation_flags
    FOR UPDATE
    TO authenticated
    USING (public.is_staff())
    WITH CHECK (public.is_staff());
  END IF;
END $$;

REVOKE ALL ON FUNCTION public.admin_set_staff_role(text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_staff_role(text, boolean) TO authenticated;
REVOKE ALL ON FUNCTION public.admin_list_staff() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_staff() TO authenticated;
REVOKE ALL ON FUNCTION public.is_staff() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;