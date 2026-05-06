DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_staff_select_all'
  ) THEN
    CREATE POLICY profiles_staff_select_all
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (public.is_staff());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'chats' AND policyname = 'chats_staff_select_all'
  ) THEN
    CREATE POLICY chats_staff_select_all
    ON public.chats
    FOR SELECT
    TO authenticated
    USING (public.is_staff());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'messages' AND policyname = 'messages_staff_select_all'
  ) THEN
    CREATE POLICY messages_staff_select_all
    ON public.messages
    FOR SELECT
    TO authenticated
    USING (public.is_staff());
  END IF;
END $$;