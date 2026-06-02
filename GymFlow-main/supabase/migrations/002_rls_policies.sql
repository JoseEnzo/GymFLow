-- ============================================================
-- GymFlow — Row Level Security Policies
-- ============================================================

-- Habilitar RLS em todas as tabelas
alter table profiles          enable row level security;
alter table academies         enable row level security;
alter table academy_members   enable row level security;
alter table invites           enable row level security;
alter table exercises         enable row level security;
alter table workout_sheets    enable row level security;
alter table sheet_exercises   enable row level security;
alter table workout_logs      enable row level security;
alter table set_logs          enable row level security;

-- ──────────────────────────────────────────────
-- profiles
-- ──────────────────────────────────────────────
create policy "Usuário vê seu próprio perfil"
  on profiles for select using (id = auth.uid());

create policy "Membros da mesma academia vêem perfis"
  on profiles for select using (
    id in (
      select user_id from academy_members
      where academy_id = any(get_user_academy_ids())
        and is_active = true
    )
  );

create policy "Usuário edita seu próprio perfil"
  on profiles for update using (id = auth.uid());

create policy "Usuário cria seu próprio perfil"
  on profiles for insert with check (id = auth.uid());

-- ──────────────────────────────────────────────
-- academies
-- ──────────────────────────────────────────────
create policy "Membros vêem suas academias"
  on academies for select using (
    id = any(get_user_academy_ids())
  );

create policy "Owner edita sua academia"
  on academies for update using (owner_id = auth.uid());

create policy "Usuário cria academia"
  on academies for insert with check (owner_id = auth.uid());

-- ──────────────────────────────────────────────
-- academy_members
-- ──────────────────────────────────────────────
create policy "Membros vêem outros membros da mesma academia"
  on academy_members for select using (
    academy_id = any(get_user_academy_ids())
  );

create policy "Owner e personal gerenciam membros"
  on academy_members for insert with check (
    get_user_role_in_academy(academy_id) in ('owner', 'personal')
    or auth.uid() = user_id  -- auto-ingresso via convite
  );

create policy "Owner desativa membros"
  on academy_members for update using (
    get_user_role_in_academy(academy_id) = 'owner'
    or user_id = auth.uid()
  );

-- ──────────────────────────────────────────────
-- invites
-- ──────────────────────────────────────────────
create policy "Membros vêem convites da academia"
  on invites for select using (
    academy_id = any(get_user_academy_ids())
    or token is not null  -- acesso público para validar token
  );

create policy "Qualquer um pode ver convite por token"
  on invites for select using (true);  -- filtrado no query

create policy "Owner e personal criam convites"
  on invites for insert with check (
    get_user_role_in_academy(academy_id) in ('owner', 'personal')
  );

create policy "Owner e personal gerenciam convites"
  on invites for update using (
    get_user_role_in_academy(academy_id) in ('owner', 'personal')
    or auth.role() = 'service_role'
  );

-- ──────────────────────────────────────────────
-- exercises
-- ──────────────────────────────────────────────
create policy "Todos vêem exercícios globais"
  on exercises for select using (
    is_global = true
    or academy_id = any(get_user_academy_ids())
    or created_by = auth.uid()
  );

create policy "Personal e owner criam exercícios"
  on exercises for insert with check (
    is_global = false
    and (
      academy_id is null
      or get_user_role_in_academy(academy_id) in ('owner', 'personal')
    )
  );

create policy "Criador edita seu exercício"
  on exercises for update using (
    created_by = auth.uid()
    or (academy_id is not null and get_user_role_in_academy(academy_id) = 'owner')
  );

-- ──────────────────────────────────────────────
-- workout_sheets
-- ──────────────────────────────────────────────
create policy "Aluno vê suas fichas"
  on workout_sheets for select using (
    student_id = auth.uid()
    or personal_id = auth.uid()
    or get_user_role_in_academy(academy_id) = 'owner'
  );

create policy "Personal cria fichas"
  on workout_sheets for insert with check (
    personal_id = auth.uid()
    and get_user_role_in_academy(academy_id) in ('personal', 'owner')
  );

create policy "Personal edita fichas"
  on workout_sheets for update using (
    personal_id = auth.uid()
    or get_user_role_in_academy(academy_id) = 'owner'
  );

create policy "Personal deleta fichas"
  on workout_sheets for delete using (
    personal_id = auth.uid()
    or get_user_role_in_academy(academy_id) = 'owner'
  );

-- ──────────────────────────────────────────────
-- sheet_exercises
-- ──────────────────────────────────────────────
create policy "Vê exercícios de fichas acessíveis"
  on sheet_exercises for select using (
    sheet_id in (
      select id from workout_sheets
      where student_id = auth.uid()
        or personal_id = auth.uid()
        or get_user_role_in_academy(academy_id) = 'owner'
    )
  );

create policy "Personal gerencia exercícios da ficha"
  on sheet_exercises for all using (
    sheet_id in (
      select id from workout_sheets
      where personal_id = auth.uid()
        or get_user_role_in_academy(academy_id) = 'owner'
    )
  );

-- ──────────────────────────────────────────────
-- workout_logs
-- ──────────────────────────────────────────────
create policy "Aluno vê seus treinos"
  on workout_logs for select using (
    student_id = auth.uid()
    or get_user_role_in_academy(academy_id) in ('personal', 'owner')
  );

create policy "Aluno registra treino"
  on workout_logs for insert with check (student_id = auth.uid());

create policy "Aluno conclui treino"
  on workout_logs for update using (student_id = auth.uid());

-- ──────────────────────────────────────────────
-- set_logs
-- ──────────────────────────────────────────────
create policy "Aluno vê suas séries"
  on set_logs for select using (
    workout_log_id in (
      select id from workout_logs
      where student_id = auth.uid()
        or get_user_role_in_academy(academy_id) in ('personal', 'owner')
    )
  );

create policy "Aluno registra séries"
  on set_logs for insert with check (
    workout_log_id in (
      select id from workout_logs where student_id = auth.uid()
    )
  );

create policy "Aluno atualiza séries"
  on set_logs for update using (
    workout_log_id in (
      select id from workout_logs where student_id = auth.uid()
    )
  );
