-- ============================================================
-- GymFlow — Tipo de programação (diária / semanal / mensal)
-- ============================================================

-- Tipo de programação na ficha
alter table workout_sheets
  add column if not exists schedule_type text not null default 'daily'
  constraint chk_schedule_type check (schedule_type in ('daily', 'weekly', 'monthly'));

-- Índice do dia na série de exercícios
-- NULL  = diária (comportamento atual)
-- 0-6   = semanal (0=Dom, 1=Seg, ..., 6=Sáb)
-- 1-4   = mensal (Semana 1, 2, 3, 4)
alter table sheet_exercises
  add column if not exists day_index smallint;

create index if not exists idx_sheet_exercises_day
  on sheet_exercises(sheet_id, day_index);
