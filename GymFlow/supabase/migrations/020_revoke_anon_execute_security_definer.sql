-- Revoke EXECUTE from PUBLIC and anon on all SECURITY DEFINER functions.
-- Helper functions (can_manage_personals, get_user_academy_ids, get_user_role_in_academy)
-- remain accessible to authenticated only (used by RLS policies for logged-in users).
-- Trigger functions (handle_new_user, rls_auto_enable) need no role grants; the trigger
-- mechanism invokes them as the function owner.

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_manage_personals(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_academy_ids() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_role_in_academy(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.can_manage_personals(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_academy_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role_in_academy(uuid) TO authenticated;

-- Explicit revoke from anon (Supabase uses per-role grants, not just PUBLIC)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon;
REVOKE EXECUTE ON FUNCTION public.can_manage_personals(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_academy_ids() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_role_in_academy(uuid) FROM anon;

-- Trigger functions: also revoke from authenticated
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM authenticated;
