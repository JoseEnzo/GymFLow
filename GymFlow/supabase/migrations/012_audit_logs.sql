-- audit_logs: append-only, rastreia ações sensíveis para LGPD e segurança.
-- Retenção recomendada: 2 anos (configurar pg_cron em produção).
create table if not exists audit_logs (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        references auth.users(id) on delete set null,
  action      text        not null,
  metadata    jsonb       not null default '{}',
  ip_address  text,
  created_at  timestamptz not null default now()
);

comment on table audit_logs is 'Logs de auditoria imutáveis. Retenção: 2 anos (LGPD).';

alter table audit_logs enable row level security;

-- Apenas service_role pode inserir (server-side via admin client)
create policy "service_role_insert" on audit_logs
  for insert
  with check (auth.jwt() ->> 'role' = 'service_role');

-- Usuário autenticado pode ler seus próprios logs
create policy "user_read_own" on audit_logs
  for select
  using (auth.uid() = user_id);

create index audit_logs_user_created_idx on audit_logs (user_id, created_at desc);
create index audit_logs_action_idx        on audit_logs (action);
