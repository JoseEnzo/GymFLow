-- ============================================================
-- GymFlow — Fichas prontas com exatamente 3 exercícios
-- ============================================================
-- Cada ficha-modelo (workout_sheet_templates) passa a ter apenas
-- 3 exercícios: os 3 principais de cada nível (os primeiros, que
-- são os compostos/base). Os sets/reps/descanso já variam por
-- intensidade (level), então a "intensidade" é preservada.
-- Antes os templates tinham 4–5 exercícios. Idempotente.
-- ============================================================

-- 1. Remove o excedente: mantém os 3 menores order_index por template.
delete from template_exercises te
using (
  select id,
         row_number() over (partition by template_id order by order_index, id) as rn
  from template_exercises
) ranked
where te.id = ranked.id
  and ranked.rn > 3;

-- 2. Renumera os 3 restantes para 0,1,2 (evita lacunas de order_index).
update template_exercises te
set order_index = ranked.new_ord
from (
  select id,
         (row_number() over (partition by template_id order by order_index, id) - 1) as new_ord
  from template_exercises
) ranked
where te.id = ranked.id
  and te.order_index <> ranked.new_ord;
