CREATE OR REPLACE FUNCTION public.spend_my_credits(_amount bigint)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_balance bigint;
  credit_row_id uuid;
  caller_email text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF _amount IS NULL OR _amount <= 0 THEN
    RAISE EXCEPTION 'amount must be positive';
  END IF;

  caller_email := lower(coalesce(auth.jwt() ->> 'email', ''));

  SELECT id INTO credit_row_id
  FROM public.user_credits
  WHERE user_id = auth.uid()
     OR lower(email) = caller_email
  ORDER BY updated_at DESC
  LIMIT 1
  FOR UPDATE;

  IF credit_row_id IS NULL THEN
    RAISE EXCEPTION 'not enough credits';
  END IF;

  UPDATE public.user_credits
  SET balance = balance - _amount,
      updated_at = now(),
      user_id = COALESCE(user_id, auth.uid())
  WHERE id = credit_row_id
    AND balance >= _amount
  RETURNING balance INTO next_balance;

  IF next_balance IS NULL THEN
    RAISE EXCEPTION 'not enough credits';
  END IF;

  RETURN next_balance;
END;
$$;