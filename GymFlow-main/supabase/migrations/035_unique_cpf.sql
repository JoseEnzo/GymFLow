-- ============================================================
-- GymFlow — CPF único por pessoa
-- ============================================================
-- Problema: profiles.cpf era apenas text, sem unicidade, então
-- a mesma pessoa podia abrir várias contas com o mesmo CPF.
-- Solução: índice único parcial — exige unicidade nos CPFs
-- preenchidos, mas permite múltiplos NULL (cadastros sem CPF).
-- ============================================================

create unique index if not exists uq_profiles_cpf
  on profiles (cpf)
  where cpf is not null;
