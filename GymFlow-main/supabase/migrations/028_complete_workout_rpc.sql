-- RPC complete_workout: insere workout_log + set_logs numa única transação.
-- Resolve atomicidade do salvamento de treino (antes: dois inserts separados podiam
-- deixar workout_log órfão se set_logs falhasse). Suporta idempotência via client_id
-- para que reenvios não dupliquem logs.

-- ──────────────────────────────────────────────
-- 1. Coluna de idempotência em workout_logs
-- ──────────────────────────────────────────────
ALTER TABLE workout_logs
  ADD COLUMN IF NOT EXISTS client_id uuid;

-- Único por (aluno, academia, client_id) — ignora linhas sem client_id (legado).
CREATE UNIQUE INDEX IF NOT EXISTS idx_workout_logs_idempotency
  ON workout_logs(student_id, academy_id, client_id)
  WHERE client_id IS NOT NULL;

-- ──────────────────────────────────────────────
-- 2. Função RPC
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.complete_workout(
  p_sheet_id        uuid,
  p_academy_id      uuid,
  p_duration_seconds int,
  p_set_logs        jsonb,
  p_client_id       uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_user_id          uuid := auth.uid();
  v_log_id           uuid;
  v_existing_log_id  uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado' USING ERRCODE = '42501';
  END IF;

  -- Verifica que o usuário é membro ativo da academia.
  -- A RLS de insert de workout_logs hoje só checa student_id; aqui fechamos esse gap.
  IF NOT EXISTS (
    SELECT 1 FROM academy_members
    WHERE user_id = v_user_id
      AND academy_id = p_academy_id
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Usuário não pertence a esta academia' USING ERRCODE = '42501';
  END IF;

  -- Idempotência: se já existe log com este client_id, devolve o id existente.
  IF p_client_id IS NOT NULL THEN
    SELECT id INTO v_existing_log_id
    FROM workout_logs
    WHERE student_id = v_user_id
      AND academy_id = p_academy_id
      AND client_id  = p_client_id;
    IF v_existing_log_id IS NOT NULL THEN
      RETURN v_existing_log_id;
    END IF;
  END IF;

  INSERT INTO workout_logs (
    student_id, sheet_id, academy_id, duration_seconds, completed_at, client_id
  )
  VALUES (
    v_user_id, p_sheet_id, p_academy_id, p_duration_seconds, now(), p_client_id
  )
  RETURNING id INTO v_log_id;

  INSERT INTO set_logs (
    workout_log_id, sheet_exercise_id, exercise_id,
    set_number, reps_done, weight_kg, is_completed
  )
  SELECT
    v_log_id,
    (s->>'sheet_exercise_id')::uuid,
    (s->>'exercise_id')::uuid,
    (s->>'set_number')::smallint,
    (s->>'reps_done')::smallint,
    NULLIF(s->>'weight_kg', '')::numeric,
    COALESCE((s->>'is_completed')::boolean, true)
  FROM jsonb_array_elements(COALESCE(p_set_logs, '[]'::jsonb)) AS s;

  RETURN v_log_id;
END;
$$;

-- ──────────────────────────────────────────────
-- 3. Grants (segue padrão da migration 020)
-- ──────────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.complete_workout(uuid, uuid, int, jsonb, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.complete_workout(uuid, uuid, int, jsonb, uuid) FROM anon;
GRANT  EXECUTE ON FUNCTION public.complete_workout(uuid, uuid, int, jsonb, uuid) TO authenticated;
