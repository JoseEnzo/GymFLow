-- 013_lgpd.sql
-- Rastreamento de aceite de termos e retenção automática de audit_logs.

-- ── 1. Registro de aceite de termos nos perfis ──────────────────────────────
-- Permite provar quando e qual versão dos termos o usuário aceitou (LGPD Art. 7º, I).
alter table profiles
  add column if not exists terms_accepted_at  timestamptz,
  add column if not exists terms_version      text;

comment on column profiles.terms_accepted_at is 'Timestamp do aceite dos Termos de Uso/Política de Privacidade (LGPD base legal).';
comment on column profiles.terms_version      is 'Versão dos termos aceitos (ex: "1.0"). Atualizar quando os termos mudarem.';

-- ── 2. Retenção automática de audit_logs ────────────────────────────────────
-- LGPD exige não manter dados além do necessário. Audit logs: 2 anos.
-- pg_cron precisa estar habilitado no projeto Supabase (Dashboard → Database → Extensions).
-- Se a extensão não estiver ativa, esta parte pode ser executada separadamente após habilitar.
do $$
begin
  if exists (
    select 1 from pg_extension where extname = 'pg_cron'
  ) then
    -- Remove job anterior se existir (idempotência)
    perform cron.unschedule('cleanup-audit-logs');

    perform cron.schedule(
      'cleanup-audit-logs',
      '0 3 * * 0',  -- Todo domingo às 03:00 UTC
      $$
        delete from audit_logs
        where created_at < now() - interval '2 years';
      $$
    );
  end if;
end;
$$;
