-- Fix: qualify all column references in helper SQL functions.
-- get_user_academy_ids() and get_user_role_in_academy() are LANGUAGE sql STABLE,
-- so the PostgreSQL planner inlines them into the calling query. When the calling
-- query has JOINs (e.g., academy_members JOIN profiles in list_academy_students),
-- unqualified 'user_id' becomes ambiguous. Adding table aliases removes the ambiguity.

CREATE OR REPLACE FUNCTION public.get_user_academy_ids()
RETURNS uuid[]
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT array(
    SELECT am.academy_id
    FROM public.academy_members am
    WHERE am.user_id = auth.uid()
      AND am.is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_role_in_academy(p_academy_id uuid)
RETURNS public.member_role
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT am.role
  FROM public.academy_members am
  WHERE am.user_id = auth.uid()
    AND am.academy_id = p_academy_id
    AND am.is_active = true
  LIMIT 1;
$$;
