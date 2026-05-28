-- ============================================================
-- GymFlow — Avaliações de Bioimpedância
-- ============================================================
-- Personal registra avaliações de composição corporal para alunos.
-- Aluno pode ver seus próprios dados. Personal/owner vêem da academia.
-- ============================================================

create table bioimpedance_assessments (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  academy_id      uuid not null references academies on delete cascade,
  student_id      uuid not null references auth.users on delete cascade,
  personal_id     uuid not null references auth.users on delete cascade,
  assessed_at     date not null default current_date,
  weight_kg       numeric(5,2),
  body_fat_pct    numeric(4,1),
  muscle_mass_kg  numeric(5,2),
  bmi             numeric(4,1),
  visceral_fat    smallint check (visceral_fat between 1 and 30),
  body_water_pct  numeric(4,1),
  bone_mass_kg    numeric(4,2),
  metabolic_age   smallint,
  notes           text
);

create index idx_bio_student on bioimpedance_assessments(student_id);
create index idx_bio_academy on bioimpedance_assessments(academy_id);
create index idx_bio_date    on bioimpedance_assessments(student_id, assessed_at desc);

alter table bioimpedance_assessments enable row level security;

-- Aluno vê apenas suas próprias avaliações
create policy "Aluno vê próprias avaliações"
  on bioimpedance_assessments for select
  using (student_id = auth.uid());

-- Personal e owner da academia vêem todas da academia
create policy "Personal e owner vêem avaliações da academia"
  on bioimpedance_assessments for select
  using (
    get_user_role_in_academy(academy_id) in ('owner', 'personal')
  );

-- Personal e owner inserem avaliações
create policy "Personal e owner registram avaliações"
  on bioimpedance_assessments for insert
  with check (
    get_user_role_in_academy(academy_id) in ('owner', 'personal')
  );

-- Quem criou ou owner pode editar
create policy "Personal que criou ou owner atualiza"
  on bioimpedance_assessments for update
  using (
    personal_id = auth.uid()
    or get_user_role_in_academy(academy_id) = 'owner'
  );

-- Quem criou ou owner pode deletar
create policy "Personal que criou ou owner remove"
  on bioimpedance_assessments for delete
  using (
    personal_id = auth.uid()
    or get_user_role_in_academy(academy_id) = 'owner'
  );
