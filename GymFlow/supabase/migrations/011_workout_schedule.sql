-- ============================================================
-- GymFlow — Agenda semanal (scheduled_days)
-- ============================================================

-- Adiciona dias agendados à ficha de treino
-- Array de inteiros: 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb
alter table workout_sheets
  add column if not exists scheduled_days integer[] not null default '{}';

create index if not exists idx_sheets_scheduled_days
  on workout_sheets using gin(scheduled_days);

-- ──────────────────────────────────────────────
-- Tabela de conclusões rápidas da agenda
-- (para "marcar como concluído" sem execução completa)
-- ──────────────────────────────────────────────
create table if not exists agenda_completions (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  student_id   uuid not null references auth.users on delete cascade,
  sheet_id     uuid not null references workout_sheets on delete cascade,
  academy_id   uuid not null references academies on delete cascade,
  completed_on date not null default current_date,
  constraint uq_agenda_completion unique (student_id, sheet_id, completed_on)
);

create index if not exists idx_agenda_student    on agenda_completions(student_id);
create index if not exists idx_agenda_sheet      on agenda_completions(sheet_id);
create index if not exists idx_agenda_academy    on agenda_completions(academy_id);
create index if not exists idx_agenda_date       on agenda_completions(completed_on desc);

-- ──────────────────────────────────────────────
-- RLS: agenda_completions
-- ──────────────────────────────────────────────
alter table agenda_completions enable row level security;

-- Aluno vê/gerencia apenas as próprias conclusões
create policy "student sees own completions"
  on agenda_completions for select
  using (student_id = auth.uid());

create policy "student inserts own completions"
  on agenda_completions for insert
  with check (
    student_id = auth.uid()
    and academy_id = any(get_user_academy_ids())
  );

create policy "student deletes own completions"
  on agenda_completions for delete
  using (student_id = auth.uid());

-- Personal/owner vê conclusões de alunos da mesma academia
create policy "personal sees academy completions"
  on agenda_completions for select
  using (academy_id = any(get_user_academy_ids()));
