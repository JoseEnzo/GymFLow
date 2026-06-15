-- ============================================================
-- GymFlow — Faixa de semanas nas fichas (periodização / organização)
-- Permite rotular cada ficha por mesociclo: ex. ficha pra semanas 1-3,
-- outra pra 4-5. É só organização/etiqueta — sem troca automática.
-- ============================================================

alter table workout_sheets
  add column if not exists week_start smallint,
  add column if not exists week_end   smallint;

comment on column workout_sheets.week_start is
  'Periodização (organização): semana inicial do mesociclo que esta ficha cobre. Null = sem faixa.';
comment on column workout_sheets.week_end is
  'Periodização: semana final (inclusive). Igual/Null com week_start preenchido = ficha de 1 semana.';
