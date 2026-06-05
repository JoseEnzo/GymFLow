-- ============================================================
-- GymFlow — Auto-sync scheduled_days a partir de day_index
-- ============================================================
-- Para fichas com schedule_type='weekly':
--   scheduled_days reflete os dias da semana onde existem exercícios.
--   Garante que /agenda mostra a ficha exatamente nos dias programados.
--
-- Para schedule_type='daily':
--   scheduled_days é configurado manualmente pelo personal (DayPicker
--   em /treinos/[id]) porque os exercícios não têm day_index. Preservado.
--
-- Para schedule_type='monthly':
--   day_index ali é "semana do mês" (1-4), semântica diferente de dia
--   da semana. NÃO sincronizamos automaticamente.

CREATE OR REPLACE FUNCTION public.sync_workout_sheet_scheduled_days()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER          -- precisa skip RLS pra atualizar workout_sheets
SET search_path = public
AS $$
DECLARE
  v_sheet_id        uuid;
  v_schedule_type   text;
BEGIN
  v_sheet_id := COALESCE(NEW.sheet_id, OLD.sheet_id);

  SELECT schedule_type INTO v_schedule_type
  FROM workout_sheets
  WHERE id = v_sheet_id;

  IF v_schedule_type = 'weekly' THEN
    UPDATE workout_sheets
    SET scheduled_days = COALESCE(
      (
        SELECT array_agg(DISTINCT se.day_index ORDER BY se.day_index)
        FROM sheet_exercises se
        WHERE se.sheet_id = v_sheet_id
          AND se.day_index IS NOT NULL
      ),
      '{}'::integer[]
    )
    WHERE id = v_sheet_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_scheduled_days ON public.sheet_exercises;
CREATE TRIGGER trg_sync_scheduled_days
AFTER INSERT OR UPDATE OR DELETE ON public.sheet_exercises
FOR EACH ROW
EXECUTE FUNCTION public.sync_workout_sheet_scheduled_days();

-- Backfill: aplica a lógica em todas as fichas weekly existentes
-- pra que fichas já criadas com scheduled_days vazio voltem a aparecer
-- na agenda dos alunos.
UPDATE workout_sheets ws
SET scheduled_days = COALESCE(
  (
    SELECT array_agg(DISTINCT se.day_index ORDER BY se.day_index)
    FROM sheet_exercises se
    WHERE se.sheet_id = ws.id
      AND se.day_index IS NOT NULL
  ),
  '{}'::integer[]
)
WHERE ws.schedule_type = 'weekly';
