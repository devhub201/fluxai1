-- 1. Roles enum + table
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Security-definer role check
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin'::public.app_role);
$$;

-- 3. RLS for user_roles
DROP POLICY IF EXISTS "user_roles_select_self_or_admin" ON public.user_roles;
CREATE POLICY "user_roles_select_self_or_admin"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "user_roles_admin_manage" ON public.user_roles;
CREATE POLICY "user_roles_admin_manage"
ON public.user_roles FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 4. Auto-grant admin role on signup if email matches
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF lower(NEW.email) = 'anujgupta20010@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- 5. Backfill admin role for existing matching user
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users
WHERE lower(email) = 'anujgupta20010@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 6. Admin-wide read access on existing tables (additive, doesn't remove user policies)
DROP POLICY IF EXISTS "profiles_admin_select_all" ON public.profiles;
CREATE POLICY "profiles_admin_select_all"
ON public.profiles FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "chats_admin_select_all" ON public.chats;
CREATE POLICY "chats_admin_select_all"
ON public.chats FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "chats_admin_delete_all" ON public.chats;
CREATE POLICY "chats_admin_delete_all"
ON public.chats FOR DELETE
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "messages_admin_select_all" ON public.messages;
CREATE POLICY "messages_admin_select_all"
ON public.messages FOR SELECT
TO authenticated
USING (public.is_admin());

-- 7. App settings table (announcements, toggles, etc.)
CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_settings_read_all" ON public.app_settings;
CREATE POLICY "app_settings_read_all"
ON public.app_settings FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "app_settings_admin_write" ON public.app_settings;
CREATE POLICY "app_settings_admin_write"
ON public.app_settings FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE TRIGGER app_settings_set_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();