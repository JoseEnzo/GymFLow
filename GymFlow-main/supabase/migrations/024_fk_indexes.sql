-- Add missing indexes on FK columns flagged by the performance audit.
CREATE INDEX IF NOT EXISTS idx_set_logs_sheet_exercise_id
  ON public.set_logs(sheet_exercise_id);

CREATE INDEX IF NOT EXISTS idx_sheet_exercises_exercise_id
  ON public.sheet_exercises(exercise_id);
