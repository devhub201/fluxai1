REVOKE EXECUTE ON FUNCTION public.spend_my_credits(bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.spend_my_credits(bigint) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_my_credits() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_credits() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_grant_credits(text, bigint, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_grant_credits(text, bigint, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_role() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;