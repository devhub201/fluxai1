
-- user_credits table
CREATE TABLE public.user_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  user_id uuid,
  balance bigint NOT NULL DEFAULT 0,
  granted_total bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_credits_admin_all" ON public.user_credits
  FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "user_credits_select_own" ON public.user_credits
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR lower(email) = lower((auth.jwt() ->> 'email')));

CREATE TRIGGER user_credits_updated_at
BEFORE UPDATE ON public.user_credits
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- credit_grants audit log
CREATE TABLE public.credit_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  amount bigint NOT NULL,
  note text,
  granted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credit_grants_admin_all" ON public.credit_grants
  FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- Admin grant function
CREATE OR REPLACE FUNCTION public.admin_grant_credits(_email text, _amount bigint, _note text DEFAULT NULL)
RETURNS public.user_credits
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec public.user_credits;
  uid uuid;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  IF _email IS NULL OR length(trim(_email)) = 0 THEN
    RAISE EXCEPTION 'email required';
  END IF;
  IF _amount IS NULL OR _amount = 0 THEN
    RAISE EXCEPTION 'amount must be non-zero';
  END IF;

  SELECT id INTO uid FROM auth.users WHERE lower(email) = lower(_email) LIMIT 1;

  INSERT INTO public.user_credits (email, user_id, balance, granted_total)
  VALUES (lower(_email), uid, _amount, GREATEST(_amount, 0))
  ON CONFLICT (email) DO UPDATE
    SET balance = public.user_credits.balance + EXCLUDED.balance,
        granted_total = public.user_credits.granted_total + GREATEST(EXCLUDED.balance, 0),
        user_id = COALESCE(public.user_credits.user_id, EXCLUDED.user_id),
        updated_at = now()
  RETURNING * INTO rec;

  INSERT INTO public.credit_grants (email, amount, note, granted_by)
  VALUES (lower(_email), _amount, _note, auth.uid());

  RETURN rec;
END;
$$;

-- Read own credits
CREATE OR REPLACE FUNCTION public.get_my_credits()
RETURNS bigint
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((
    SELECT balance FROM public.user_credits
    WHERE user_id = auth.uid()
       OR lower(email) = lower((auth.jwt() ->> 'email'))
    ORDER BY updated_at DESC
    LIMIT 1
  ), 0);
$$;
