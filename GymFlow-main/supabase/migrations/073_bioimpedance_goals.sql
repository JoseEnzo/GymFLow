-- ============================================================
-- GymFlow — Metas de Bioimpedância
-- ============================================================
-- Personal define UMA meta ativa por aluno: escolhe a métrica
-- (peso, gordura %, massa muscular, etc.) + valor-alvo.
-- O aluno vê o progresso (barra animada) na própria visão de bio.
-- start_value = snapshot do valor no momento da criação, pra calcular
-- o progresso relativo (start → atual → alvo), funciona pra perder OU ganhar.
-- ============================================================

create table bioimpedance_goals (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  academy_id   uuid not null references academies on delete cascade,
  student_id   uuid not null references auth.users on delete cascade,
  personal_id  uuid not null references auth.users on delete cascade,
  metric       text not null check (metric in (
                 'weight_kg', 'body_fat_pct', 'muscle_mass_kg', 'bmi',
                 'visceral_fat', 'body_water_pct', 'metabolic_age'
               )),
  target_value numeric(6,2) not null,
  start_value  numeric(6,2),
  unique (academy_id, student_id)
);

create index idx_bio_goal_student on bioimpedance_goals(student_id);
create index idx_bio_goal_academy on bioimpedance_goals(academy_id);

alter table bioimpedance_goals enable row level security;

-- Aluno vê apenas a própria meta
create policy "Aluno vê própria meta de bio"
  on bioimpedance_goals for select
  using (student_id = auth.uid());

-- Personal e owner da academia vêem todas da academia
create policy "Personal e owner vêem metas da academia"
  on bioimpedance_goals for select
  using (get_user_role_in_academy(academy_id) in ('owner', 'personal'));

-- Personal e owner definem metas
create policy "Personal e owner definem metas de bio"
  on bioimpedance_goals for insert
  with check (get_user_role_in_academy(academy_id) in ('owner', 'personal'));

-- Quem criou ou owner pode editar
create policy "Personal que criou ou owner atualiza meta"
  on bioimpedance_goals for update
  using (
    personal_id = auth.uid()
    or get_user_role_in_academy(academy_id) = 'owner'
  );

-- Quem criou ou owner pode remover
create policy "Personal que criou ou owner remove meta"
  on bioimpedance_goals for delete
  using (
    personal_id = auth.uid()
    or get_user_role_in_academy(academy_id) = 'owner'
  );
