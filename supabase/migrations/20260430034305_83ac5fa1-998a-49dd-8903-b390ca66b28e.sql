CREATE OR REPLACE FUNCTION public.spend_user_credits(_user_id uuid, _email text, _amount bigint)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_balance bigint;
  credit_row_id uuid;
  clean_email text;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'user id required';
  END IF;

  clean_email := lower(coalesce(_email, ''));

  IF clean_email = '' THEN
    RAISE EXCEPTION 'email required';
  END IF;

  IF _amount IS NULL OR _amount <= 0 THEN
    RAISE EXCEPTION 'amount must be positive';
  END IF;

  SELECT id INTO credit_row_id
  FROM public.user_credits
  WHERE user_id = _user_id
     OR lower(email) = clean_email
  ORDER BY updated_at DESC
  LIMIT 1
  FOR UPDATE;

  IF credit_row_id IS NULL THEN
    RAISE EXCEPTION 'not enough credits';
  END IF;

  UPDATE public.user_credits
  SET balance = balance - _amount,
      updated_at = now(),
      user_id = COALESCE(user_id, _user_id)
  WHERE id = credit_row_id
    AND balance >= _amount
  RETURNING balance INTO next_balance;

  IF next_balance IS NULL THEN
    RAISE EXCEPTION 'not enough credits';
  END IF;

  RETURN next_balance;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.spend_user_credits(uuid, text, bigint) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.spend_user_credits(uuid, text, bigint) TO service_role;