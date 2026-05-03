REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_grant_credits(text, bigint, text) FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION public.spend_user_credits(uuid, text, bigint) FROM authenticated, anon, public;
GRANT EXECUTE ON FUNCTION public.get_my_credits() TO authenticated;
GRANT EXECUTE ON FUNCTION public.spend_my_credits(bigint) TO authenticated;