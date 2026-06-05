-- RPC academy_engagement_weekly: North Star Metric do GymFlow.
--
-- Mede engajamento real do aluno (treinos COMPLETADOS, não rascunhos), por
-- semana, em janela rolante. Retorna a série temporal pra plotar tendência.
--
-- Threshold padrão é 2 treinos/semana — limiar onde a literatura de hábito
-- mostra retenção de longo prazo, e dentro do que personal consegue
-- influenciar diretamente (ajuste de ficha, lembrete, conversa).
--
-- Escopo:
--   - owner: vê todos os alunos da academia (pode passar p_personal_id pra
--     filtrar por personal específico)
--   - personal: só vê seus próprios alunos (forçado server-side via invited_by)

CREATE OR REPLACE FUNCTION public.academy_engagement_weekly(
  p_academy_id   uuid,
  p_weeks_back   int  DEFAULT 8,         -- quantas semanas históricas trazer
  p_min_workouts int  DEFAULT 2,         -- threshold da NSM
  p_personal_id  uuid DEFAULT NULL       -- filtra por personal (NULL = todos)
)
RETURNS TABLE (
  week_start         date,
  active_students    bigint,             -- denominador: alunos ativos na academia
  engaged_students   bigint,             -- numerador: alunos com >= p_min_workouts
  engagement_rate    numeric(5,2)        -- engaged / active * 100
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_role    text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado' USING ERRCODE = '42501';
  END IF;

  -- Só owner ou personal da academia pode ler métricas.
  SELECT role::text INTO v_role
  FROM academy_members
  WHERE user_id    = v_user_id
    AND academy_id = p_academy_id
    AND is_active  = true
    AND role IN ('owner', 'personal')
  LIMIT 1;

  IF v_role IS NULL THEN
    RAISE EXCEPTION 'Sem permissão para ver métricas desta academia'
      USING ERRCODE = '42501';
  END IF;

  -- Personal não pode ver métricas de outro personal: se passar p_personal_id
  -- diferente do próprio, bloqueia. Se não passar, força escopo automático.
  IF v_role = 'personal' THEN
    IF p_personal_id IS NOT NULL AND p_personal_id <> v_user_id THEN
      RAISE EXCEPTION 'Personal não pode ver dados de outros personals'
        USING ERRCODE = '42501';
    END IF;
    p_personal_id := v_user_id;
  END IF;

  -- Sanitiza parâmetros.
  IF p_weeks_back   < 1 OR p_weeks_back   > 52 THEN p_weeks_back   := 8; END IF;
  IF p_min_workouts < 1 OR p_min_workouts > 14 THEN p_min_workouts := 2; END IF;

  RETURN QUERY
  WITH weeks AS (
    -- Gera as últimas N semanas (date_trunc usa ISO: semana começa segunda)
    SELECT
      (date_trunc('week', now() - (n || ' weeks')::interval))::date AS week_start
    FROM generate_series(0, p_weeks_back - 1) n
  ),
  scoped_students AS (
    -- Alunos ativos da academia, opcionalmente filtrados por quem convidou
    SELECT am.user_id
    FROM academy_members am
    WHERE am.academy_id = p_academy_id
      AND am.role       = 'student'
      AND am.is_active  = true
      AND (p_personal_id IS NULL OR am.invited_by = p_personal_id)
  ),
  weekly_counts AS (
    -- Conta treinos COMPLETADOS por aluno por semana
    SELECT
      wl.student_id,
      (date_trunc('week', wl.completed_at))::date AS week_start,
      COUNT(*)                                    AS workouts
    FROM workout_logs wl
    WHERE wl.academy_id   = p_academy_id
      AND wl.completed_at IS NOT NULL
      AND wl.completed_at >= now() - (p_weeks_back || ' weeks')::interval
      AND wl.student_id IN (SELECT user_id FROM scoped_students)
    GROUP BY wl.student_id, (date_trunc('week', wl.completed_at))::date
  ),
  weekly_engaged AS (
    -- Quantos alunos bateram o threshold em cada semana
    SELECT
      wc.week_start,
      COUNT(*) AS engaged_students
    FROM weekly_counts wc
    WHERE wc.workouts >= p_min_workouts
    GROUP BY wc.week_start
  ),
  total AS (
    SELECT COUNT(*) AS cnt FROM scoped_students
  )
  SELECT
    w.week_start,
    (SELECT cnt FROM total)            AS active_students,
    COALESCE(we.engaged_students, 0)   AS engaged_students,
    CASE
      WHEN (SELECT cnt FROM total) = 0 THEN 0::numeric(5,2)
      ELSE ROUND(
        COALESCE(we.engaged_students, 0)::numeric
          / (SELECT cnt FROM total)::numeric
          * 100,
        2
      )::numeric(5,2)
    END                                AS engagement_rate
  FROM weeks w
  LEFT JOIN weekly_engaged we ON we.week_start = w.week_start
  ORDER BY w.week_start DESC;
END;
$$;

-- Grants (segue padrão da 028/029)
REVOKE EXECUTE ON FUNCTION public.academy_engagement_weekly(uuid, int, int, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.academy_engagement_weekly(uuid, int, int, uuid) FROM anon;
GRANT  EXECUTE ON FUNCTION public.academy_engagement_weekly(uuid, int, int, uuid) TO authenticated;
