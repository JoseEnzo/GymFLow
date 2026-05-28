-- ============================================================
-- GymFlow — Medidas Corporais (Antropometria)
-- ============================================================

create table body_measurements (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  academy_id       uuid not null references academies on delete cascade,
  student_id       uuid not null references auth.users on delete cascade,
  personal_id      uuid not null references auth.users on delete cascade,
  measured_at      date not null default current_date,
  -- Tronco
  neck_cm          numeric(5,1),
  shoulder_cm      numeric(5,1),
  chest_cm         numeric(5,1),
  waist_cm         numeric(5,1),
  abdomen_cm       numeric(5,1),
  hip_cm           numeric(5,1),
  -- Braços
  arm_right_cm     numeric(5,1),
  arm_left_cm      numeric(5,1),
  forearm_right_cm numeric(5,1),
  forearm_left_cm  numeric(5,1),
  -- Pernas
  thigh_right_cm   numeric(5,1),
  thigh_left_cm    numeric(5,1),
  calf_right_cm    numeric(5,1),
  calf_left_cm     numeric(5,1),
  notes            text
);

create index idx_measurements_student on body_measurements(student_id);
create index idx_measurements_academy on body_measurements(academy_id);
create index idx_measurements_date    on body_measurements(student_id, measured_at desc);

alter table body_measurements enable row level security;

create policy "Aluno vê próprias medidas"
  on body_measurements for select
  using (student_id = auth.uid());

create policy "Personal e owner vêem medidas da academia"
  on body_measurements for select
  using (get_user_role_in_academy(academy_id) in ('owner', 'personal'));

create policy "Personal e owner registram medidas"
  on body_measurements for insert
  with check (get_user_role_in_academy(academy_id) in ('owner', 'personal'));

create policy "Personal que criou ou owner atualiza medidas"
  on body_measurements for update
  using (personal_id = auth.uid() or get_user_role_in_academy(academy_id) = 'owner');

create policy "Personal que criou ou owner remove medidas"
  on body_measurements for delete
  using (personal_id = auth.uid() or get_user_role_in_academy(academy_id) = 'owner');
