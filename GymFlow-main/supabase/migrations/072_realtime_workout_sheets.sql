-- 072_realtime_workout_sheets.sql
--
-- Habilita Supabase Realtime nas tabelas de ficha pra que o aluno veja
-- atualizações automáticas quando o personal/owner adiciona/edita exercícios
-- ou atribui uma nova ficha — sem precisar dar reload na página.
--
-- O Realtime via postgres_changes respeita a RLS da sessão do cliente: o aluno
-- só recebe eventos das linhas que ele já poderia ler (suas próprias fichas).
-- Nenhum dado de outro tenant vaza pelo canal.
--
-- REPLICA IDENTITY FULL: por padrão (DEFAULT) o payload de UPDATE/DELETE só
-- carrega a PK no registro "old", então filtros por colunas não-PK
-- (sheet_id em sheet_exercises, student_id em workout_sheets) NÃO casam em
-- eventos DELETE/UPDATE. FULL inclui a linha inteira no old record, fazendo o
-- filtro funcionar nos 3 eventos. Tabelas pequenas — custo de WAL aceitável.

alter table public.workout_sheets  replica identity full;
alter table public.sheet_exercises replica identity full;

-- Idempotente: replay do chain em ambiente novo não quebra se a tabela já
-- estiver na publicação.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'workout_sheets'
  ) then
    alter publication supabase_realtime add table public.workout_sheets;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'sheet_exercises'
  ) then
    alter publication supabase_realtime add table public.sheet_exercises;
  end if;
end $$;
