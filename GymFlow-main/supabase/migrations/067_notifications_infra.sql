-- ============================================================
-- GymFlow — Infra de notificações (MVP: email semanal de inatividade)
-- 1) notification_preferences: opt-in por user (default true)
-- 2) sent_notifications: idempotência cron-retry
-- ============================================================

-- ── Preferences ────────────────────────────────────────────
create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email_weekly_report boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

-- Usuário só lê/escreve as próprias preferences. Cron route usa service_role,
-- então bypassa RLS — não precisa policy pra cron.
create policy "own_prefs_select"
  on public.notification_preferences
  for select
  using (user_id = (select auth.uid()));

create policy "own_prefs_upsert"
  on public.notification_preferences
  for insert
  with check (user_id = (select auth.uid()));

create policy "own_prefs_update"
  on public.notification_preferences
  for update
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ── Idempotência cron ──────────────────────────────────────
create table if not exists public.sent_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  target_date date not null,
  sent_at timestamptz not null default now(),
  unique (user_id, kind, target_date)
);

alter table public.sent_notifications enable row level security;

-- Sem policies: só service_role acessa via cron route.
-- RLS habilitado garante que nenhum cliente autenticado consiga ler/escrever.

comment on table public.notification_preferences is
  'Preferences de notificação por user. RLS: dono lê/escreve. Cron usa service_role.';

comment on table public.sent_notifications is
  'Registro idempotente de notificações enviadas (kind+date unique por user). Service_role only.';
