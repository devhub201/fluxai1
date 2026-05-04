
-- Custom tools created by admins (and AI-built)
CREATE TABLE public.custom_tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'AI',
  icon text NOT NULL DEFAULT 'Sparkles',
  credits integer NOT NULL DEFAULT 5,
  system_prompt text NOT NULL DEFAULT '',
  placeholder text NOT NULL DEFAULT '',
  suggestions jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.custom_tools ENABLE ROW LEVEL SECURITY;
CREATE POLICY custom_tools_admin_all ON public.custom_tools FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY custom_tools_read_active ON public.custom_tools FOR SELECT TO authenticated USING (is_active = true);
CREATE TRIGGER trg_custom_tools_updated BEFORE UPDATE ON public.custom_tools FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Admin changelog (What's New banner)
CREATE TABLE public.admin_changelog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  version text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_changelog ENABLE ROW LEVEL SECURITY;
CREATE POLICY changelog_admin_all ON public.admin_changelog FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY changelog_read_all ON public.admin_changelog FOR SELECT TO authenticated USING (true);

-- User bans
CREATE TABLE public.user_bans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  reason text NOT NULL DEFAULT '',
  banned_by uuid,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_bans ENABLE ROW LEVEL SECURITY;
CREATE POLICY bans_admin_all ON public.user_bans FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY bans_read_self ON public.user_bans FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Moderation flags
CREATE TABLE public.moderation_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  target_type text NOT NULL DEFAULT 'message',
  target_id uuid,
  reason text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open',
  reviewed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.moderation_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY flags_admin_all ON public.moderation_flags FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY flags_insert_own ON public.moderation_flags FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY flags_select_own ON public.moderation_flags FOR SELECT TO authenticated USING (auth.uid() = reporter_id);
CREATE TRIGGER trg_flags_updated BEFORE UPDATE ON public.moderation_flags FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Feature flags
CREATE TABLE public.feature_flags (
  key text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT false,
  description text NOT NULL DEFAULT '',
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY flags_cfg_admin_all ON public.feature_flags FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY flags_cfg_read_all ON public.feature_flags FOR SELECT TO authenticated USING (true);

-- Seed feature flags
INSERT INTO public.feature_flags (key, enabled, description) VALUES
  ('maintenance_mode', false, 'Temporarily disable the app for non-admins'),
  ('signup_open', true, 'Allow new user signups'),
  ('website_builder_pro', true, 'Allow Pro mode in Website Builder'),
  ('publish_enabled', true, 'Allow users to publish sites'),
  ('image_gen_enabled', true, 'Enable AI image generator')
ON CONFLICT (key) DO NOTHING;

-- Bulk credit grant function (admin)
CREATE OR REPLACE FUNCTION public.admin_bulk_grant_credits(_amount bigint, _note text DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected integer := 0;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  IF _amount IS NULL OR _amount = 0 THEN RAISE EXCEPTION 'amount must be non-zero'; END IF;
  UPDATE public.user_credits SET balance = balance + _amount, granted_total = granted_total + GREATEST(_amount,0), updated_at = now();
  GET DIAGNOSTICS affected = ROW_COUNT;
  INSERT INTO public.credit_grants (email, amount, note, granted_by) VALUES ('*bulk*', _amount, COALESCE(_note,'bulk grant'), auth.uid());
  RETURN affected;
END;
$$;

-- Reset all credits (admin)
CREATE OR REPLACE FUNCTION public.admin_reset_all_credits()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected integer := 0;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  UPDATE public.user_credits SET balance = 0, updated_at = now();
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;
