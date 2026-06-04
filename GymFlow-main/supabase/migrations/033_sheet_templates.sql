-- ============================================================
-- GymFlow — Fichas de treino prontas (templates globais)
-- ============================================================

create table if not exists workout_sheet_templates (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  muscle_group text not null,
  level        text not null constraint chk_template_level check (level in ('Iniciante','Intermediário','Avançado')),
  goal         text
);

create table if not exists template_exercises (
  id          uuid primary key default gen_random_uuid(),
  template_id uuid not null references workout_sheet_templates on delete cascade,
  exercise_id uuid not null references exercises on delete cascade,
  order_index smallint not null default 0,
  sets        smallint not null default 3,
  reps        text    not null default '12',
  rest_seconds smallint not null default 60,
  notes       text
);

create index if not exists idx_template_exercises_template on template_exercises(template_id);

-- RLS: leitura pública (não há dados sensíveis aqui)
alter table workout_sheet_templates enable row level security;
alter table template_exercises      enable row level security;

create policy "public read workout_sheet_templates"
  on workout_sheet_templates for select using (true);

create policy "public read template_exercises"
  on template_exercises for select using (true);
