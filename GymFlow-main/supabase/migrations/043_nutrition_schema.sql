-- ============================================================
-- GymFlow — Nutrição: receitas, dietas (templates) e planos alimentares
-- Espelha a arquitetura de treino:
--   exercises               ->  recipes              (catálogo)
--   workout_sheet_templates ->  diet_templates       (dietas prontas globais)
--   workout_sheets          ->  meal_plans           (plano atribuído ao aluno)
--   sheet_exercises         ->  meal_plan_items      (receitas dentro do plano)
-- ============================================================

-- ──────────────────────────────────────────────
-- Enum de refeições do dia
-- ──────────────────────────────────────────────
do $$ begin
  create type meal_type as enum (
    'cafe_da_manha',
    'lanche_manha',
    'almoco',
    'lanche_tarde',
    'jantar',
    'ceia',
    'pre_treino',
    'pos_treino'
  );
exception when duplicate_object then null;
end $$;

-- ──────────────────────────────────────────────
-- recipes — catálogo de receitas (paralelo a exercises)
-- ──────────────────────────────────────────────
create table if not exists recipes (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  name          text not null,
  description   text,
  meal_types    meal_type[] not null default '{}',  -- uma receita pode servir várias refeições
  calories      integer not null default 0,          -- kcal por porção
  protein_g     numeric(6,1) not null default 0,
  carbs_g       numeric(6,1) not null default 0,
  fat_g         numeric(6,1) not null default 0,
  prep_minutes  smallint not null default 0,
  servings      smallint not null default 1,
  difficulty    exercise_difficulty not null default 'beginner',
  ingredients   text[] not null default '{}',
  instructions  text[],
  tags          text[] not null default '{}',        -- ex: low-carb, vegano, sem-lactose
  image_url     text,
  is_global     boolean not null default false,
  created_by    uuid references auth.users,
  academy_id    uuid references academies on delete cascade
);

-- ──────────────────────────────────────────────
-- diet_templates — dietas prontas globais (paralelo a workout_sheet_templates)
-- ──────────────────────────────────────────────
create table if not exists diet_templates (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  goal           text,
  description    text,
  daily_calories integer,
  level          text not null default 'Intermediário'
                 constraint chk_diet_level check (level in ('Iniciante','Intermediário','Avançado')),
  tags           text[] not null default '{}'
);

create table if not exists diet_template_items (
  id          uuid primary key default gen_random_uuid(),
  template_id uuid not null references diet_templates on delete cascade,
  recipe_id   uuid not null references recipes on delete cascade,
  meal_type   meal_type not null,
  order_index smallint not null default 0,
  servings    numeric(4,1) not null default 1
);

-- ──────────────────────────────────────────────
-- meal_plans — plano alimentar atribuído ao aluno (paralelo a workout_sheets)
-- ──────────────────────────────────────────────
create table if not exists meal_plans (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  academy_id      uuid not null references academies on delete cascade,
  student_id      uuid not null references auth.users on delete cascade,
  personal_id     uuid not null references auth.users on delete cascade,
  name            text not null,
  goal            text,                  -- Emagrecimento, Hipertrofia, Manutenção...
  description     text,
  daily_calories  integer,               -- meta de kcal/dia
  is_active       boolean not null default true,
  valid_until     date,
  order_index     smallint not null default 0
);

create table if not exists meal_plan_items (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  plan_id      uuid not null references meal_plans on delete cascade,
  recipe_id    uuid not null references recipes on delete restrict,
  meal_type    meal_type not null,        -- refeição do dia
  day_index    smallint,                  -- null = todos os dias; 0-6 = dia da semana
  order_index  smallint not null default 0,
  servings     numeric(4,1) not null default 1,
  notes        text
);

-- ──────────────────────────────────────────────
-- Índices (FKs muito consultadas)
-- ──────────────────────────────────────────────
create index if not exists idx_recipes_academy            on recipes(academy_id);
create index if not exists idx_recipes_created_by          on recipes(created_by);
create index if not exists idx_diet_template_items_tpl     on diet_template_items(template_id);
create index if not exists idx_diet_template_items_recipe  on diet_template_items(recipe_id);
create index if not exists idx_meal_plans_academy          on meal_plans(academy_id);
create index if not exists idx_meal_plans_student          on meal_plans(student_id);
create index if not exists idx_meal_plans_personal         on meal_plans(personal_id);
create index if not exists idx_meal_plan_items_plan        on meal_plan_items(plan_id);
create index if not exists idx_meal_plan_items_recipe      on meal_plan_items(recipe_id);

-- ──────────────────────────────────────────────
-- updated_at trigger no meal_plans (reaproveita set_updated_at do schema inicial)
-- ──────────────────────────────────────────────
drop trigger if exists trg_meal_plans_updated_at on meal_plans;
create trigger trg_meal_plans_updated_at
  before update on meal_plans
  for each row execute function set_updated_at();

-- ══════════════════════════════════════════════
-- RLS
-- ══════════════════════════════════════════════
alter table recipes              enable row level security;
alter table diet_templates       enable row level security;
alter table diet_template_items  enable row level security;
alter table meal_plans           enable row level security;
alter table meal_plan_items      enable row level security;

-- Idempotência: remove policies antes de recriar (permite reexecutar a migration)
drop policy if exists "Todos vêem receitas globais"      on recipes;
drop policy if exists "Personal e owner criam receitas"  on recipes;
drop policy if exists "Criador edita sua receita"        on recipes;
drop policy if exists "Criador deleta sua receita"       on recipes;
drop policy if exists "public read diet_templates"       on diet_templates;
drop policy if exists "public read diet_template_items"  on diet_template_items;
drop policy if exists "Aluno vê seus planos"             on meal_plans;
drop policy if exists "Personal cria planos"             on meal_plans;
drop policy if exists "Personal edita planos"            on meal_plans;
drop policy if exists "Personal deleta planos"           on meal_plans;
drop policy if exists "Vê itens de planos acessíveis"    on meal_plan_items;
drop policy if exists "Personal gerencia itens do plano" on meal_plan_items;

-- ── recipes ───────────────────────────────────
create policy "Todos vêem receitas globais"
  on recipes for select using (
    is_global = true
    or academy_id = any(get_user_academy_ids())
    or created_by = auth.uid()
  );

create policy "Personal e owner criam receitas"
  on recipes for insert with check (
    is_global = false
    and (
      academy_id is null
      or get_user_role_in_academy(academy_id) in ('owner', 'personal')
    )
  );

create policy "Criador edita sua receita"
  on recipes for update using (
    created_by = auth.uid()
    or (academy_id is not null and get_user_role_in_academy(academy_id) = 'owner')
  );

create policy "Criador deleta sua receita"
  on recipes for delete using (
    created_by = auth.uid()
    or (academy_id is not null and get_user_role_in_academy(academy_id) = 'owner')
  );

-- ── diet_templates (leitura pública, sem dados sensíveis) ──
create policy "public read diet_templates"
  on diet_templates for select using (true);

create policy "public read diet_template_items"
  on diet_template_items for select using (true);

-- ── meal_plans ────────────────────────────────
create policy "Aluno vê seus planos"
  on meal_plans for select using (
    student_id = auth.uid()
    or personal_id = auth.uid()
    or get_user_role_in_academy(academy_id) = 'owner'
  );

create policy "Personal cria planos"
  on meal_plans for insert with check (
    personal_id = auth.uid()
    and get_user_role_in_academy(academy_id) in ('personal', 'owner')
  );

create policy "Personal edita planos"
  on meal_plans for update using (
    personal_id = auth.uid()
    or get_user_role_in_academy(academy_id) = 'owner'
  );

create policy "Personal deleta planos"
  on meal_plans for delete using (
    personal_id = auth.uid()
    or get_user_role_in_academy(academy_id) = 'owner'
  );

-- ── meal_plan_items ───────────────────────────
create policy "Vê itens de planos acessíveis"
  on meal_plan_items for select using (
    plan_id in (
      select id from meal_plans
      where student_id = auth.uid()
        or personal_id = auth.uid()
        or get_user_role_in_academy(academy_id) = 'owner'
    )
  );

create policy "Personal gerencia itens do plano"
  on meal_plan_items for all using (
    plan_id in (
      select id from meal_plans
      where personal_id = auth.uid()
        or get_user_role_in_academy(academy_id) = 'owner'
    )
  );
