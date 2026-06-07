-- ============================================================
-- GymFlow — Catálogo de ingredientes crus (food_items)
-- Diferente de recipes: ingrediente único, macros por 100g.
-- Personal usa pra montar refeição direto ("250g arroz + 150g frango")
-- sem precisar criar uma receita só pra isso.
-- ============================================================

-- ──────────────────────────────────────────────
-- food_items — catálogo paralelo a recipes
-- ──────────────────────────────────────────────
create table if not exists food_items (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  name             text not null,
  kcal_per_100g    numeric(6,1) not null default 0,
  protein_per_100g numeric(6,1) not null default 0,
  carbs_per_100g   numeric(6,1) not null default 0,
  fat_per_100g     numeric(6,1) not null default 0,
  category         text,                 -- ex: proteina, carboidrato, gordura, fruta, vegetal
  is_global        boolean not null default false,
  created_by       uuid references auth.users,
  academy_id       uuid references academies on delete cascade
);

create index if not exists idx_food_items_academy    on food_items(academy_id);
create index if not exists idx_food_items_created_by on food_items(created_by);
create index if not exists idx_food_items_category   on food_items(category);

-- ──────────────────────────────────────────────
-- meal_plan_items — passar a aceitar ingrediente OU receita
-- ──────────────────────────────────────────────
alter table meal_plan_items alter column recipe_id drop not null;

alter table meal_plan_items
  add column if not exists food_item_id uuid references food_items on delete restrict;

create index if not exists idx_meal_plan_items_food on meal_plan_items(food_item_id);

-- Constraint: exatamente um dos dois (recipe_id XOR food_item_id) deve estar preenchido.
do $$ begin
  alter table meal_plan_items
    add constraint chk_meal_plan_items_one_source
    check ((recipe_id is not null and food_item_id is null)
        or (recipe_id is null and food_item_id is not null));
exception when duplicate_object then null;
end $$;

-- ──────────────────────────────────────────────
-- RLS — espelha policies de recipes
-- ──────────────────────────────────────────────
alter table food_items enable row level security;

drop policy if exists "Todos vêem ingredientes globais"     on food_items;
drop policy if exists "Personal e owner criam ingredientes" on food_items;
drop policy if exists "Criador edita seu ingrediente"       on food_items;
drop policy if exists "Criador deleta seu ingrediente"      on food_items;

create policy "Todos vêem ingredientes globais"
  on food_items for select using (
    is_global = true
    or academy_id = any(get_user_academy_ids())
    or created_by = auth.uid()
  );

create policy "Personal e owner criam ingredientes"
  on food_items for insert with check (
    is_global = false
    and (
      academy_id is null
      or get_user_role_in_academy(academy_id) in ('owner', 'personal')
    )
  );

create policy "Criador edita seu ingrediente"
  on food_items for update using (
    created_by = auth.uid()
    or (academy_id is not null and get_user_role_in_academy(academy_id) = 'owner')
  );

create policy "Criador deleta seu ingrediente"
  on food_items for delete using (
    created_by = auth.uid()
    or (academy_id is not null and get_user_role_in_academy(academy_id) = 'owner')
  );

comment on table food_items is
  'Ingredientes crus com macros por 100g. Usado direto em meal_plan_items quando o personal quer descrever a refeição em ingredientes (ex: 250g arroz + 150g frango) sem criar uma receita.';
comment on column meal_plan_items.food_item_id is
  'Quando preenchido, o item refere-se a um ingrediente cru. recipe_id deve ser null nesse caso (check constraint).';
