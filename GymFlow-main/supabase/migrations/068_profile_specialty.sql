-- Especialidade do personal trainer (ex: Musculação, Funcional, Crossfit).
-- Exibida/editável na aba Conta de /configuracoes apenas para role 'personal'.
-- Campo livre, nullable. Não confundir com profiles.goal (objetivo de treino do aluno).
alter table public.profiles
  add column if not exists specialty text;
