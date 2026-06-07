-- ============================================================
-- GymFlow — Suporte a quantidade em gramas
-- recipes.serving_grams  → peso (g) de 1 porção da receita
-- meal_plan_items.grams  → override em gramas (quando preenchido,
--                          ignora `servings` no cálculo de macros)
-- Idempotente: ADD COLUMN IF NOT EXISTS.
-- ============================================================

alter table recipes
  add column if not exists serving_grams integer
  constraint chk_recipes_serving_grams_positive check (serving_grams is null or serving_grams > 0);

alter table meal_plan_items
  add column if not exists grams integer
  constraint chk_meal_plan_items_grams_positive check (grams is null or grams > 0);

comment on column recipes.serving_grams is
  'Peso aproximado de 1 porção em gramas. Null = recipe sem referência de peso (toggle de gramas fica desabilitado no UI).';
comment on column meal_plan_items.grams is
  'Quando preenchido, sobrescreve servings. Multiplicador efetivo = grams / recipe.serving_grams.';
