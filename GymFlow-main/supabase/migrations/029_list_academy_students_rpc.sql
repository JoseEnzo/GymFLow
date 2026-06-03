-- RPC list_academy_students: consolida 4 queries do client (academy_members + profiles
-- + workout_sheets + workout_logs) numa única query no banco com paginação e search
-- server-side. Inclui total_count para UI de paginação. Streak fica para futura RPC
-- (exige window function não-trivial).

CREATE OR REPLACE FUNCTION public.list_academy_students(
  p_academy_id uuid,
  p_search     text DEFAULT NULL,
  p_status     text DEFAULT 'all',     -- 'all' | 'active' | 'inactive'
  p_limit      int  DEFAULT 50,
  p_offset     int  DEFAULT 0
)
RETURNS TABLE (
  user_id        uuid,
  full_name      text,
  goal           text,
  is_active      boolean,
  total_workouts bigint,
  last_workout   timestamptz,
  active_sheets  bigint,
  total_count    bigint
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado' USING ERRCODE = '42501';
  END IF;

  -- Só owner ou personal pode listar alunos da academia.
  IF NOT EXISTS (
    SELECT 1 FROM academy_members
    WHERE user_id = v_user_id
      AND academy_id = p_academy_id
      AND is_active = true
      AND role IN ('owner', 'personal')
  ) THEN
    RAISE EXCEPTION 'Sem permissão para listar alunos' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH base AS (
    SELECT
      am.user_id,
      am.is_active,
      p.full_name,
      p.goal
    FROM academy_members am
    LEFT JOIN profiles p ON p.id = am.user_id
    WHERE am.academy_id = p_academy_id
      AND am.role = 'student'
      AND (
        COALESCE(p_status, 'all') = 'all'
        OR (p_status = 'active'   AND am.is_active = true)
        OR (p_status = 'inactive' AND am.is_active = false)
      )
      AND (
        COALESCE(NULLIF(p_search, ''), '') = ''
        OR extensions.unaccent(p.full_name) ILIKE '%' || extensions.unaccent(p_search) || '%'
      )
  ),
  log_metrics AS (
    SELECT
      wl.student_id,
      COUNT(*)            AS total_workouts,
      MAX(wl.created_at)  AS last_workout
    FROM workout_logs wl
    WHERE wl.academy_id = p_academy_id
      AND wl.student_id IN (SELECT b.user_id FROM base b)
    GROUP BY wl.student_id
  ),
  sheet_counts AS (
    SELECT
      ws.student_id,
      COUNT(*) AS active_sheets
    FROM workout_sheets ws
    WHERE ws.academy_id = p_academy_id
      AND ws.is_active = true
      AND ws.student_id IN (SELECT b.user_id FROM base b)
    GROUP BY ws.student_id
  ),
  total AS (
    SELECT COUNT(*) AS cnt FROM base
  )
  SELECT
    b.user_id,
    b.full_name,
    b.goal,
    b.is_active,
    COALESCE(lm.total_workouts, 0) AS total_workouts,
    lm.last_workout,
    COALESCE(sc.active_sheets, 0)  AS active_sheets,
    (SELECT cnt FROM total)        AS total_count
  FROM base b
  LEFT JOIN log_metrics  lm ON lm.student_id = b.user_id
  LEFT JOIN sheet_counts sc ON sc.student_id = b.user_id
  ORDER BY COALESCE(b.full_name, 'zzz') ASC, b.user_id
  LIMIT  p_limit
  OFFSET p_offset;
END;
$$;

-- Grants (segue padrão da 020 e 028)
REVOKE EXECUTE ON FUNCTION public.list_academy_students(uuid, text, text, int, int) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.list_academy_students(uuid, text, text, int, int) FROM anon;
GRANT  EXECUTE ON FUNCTION public.list_academy_students(uuid, text, text, int, int) TO authenticated;
