-- ============================================================
-- GymFlow — Backfill: sincroniza CPF do user_metadata → profiles
-- ============================================================
-- Copia o campo "document" do auth.users.raw_user_meta_data
-- para profiles.cpf para todos os usuários já cadastrados.
-- Afeta apenas quem tem o campo document preenchido no metadata.
-- ============================================================

update profiles p
set cpf = u.raw_user_meta_data ->> 'document'
from auth.users u
where p.id = u.id
  and u.raw_user_meta_data ->> 'document' is not null
  and (p.cpf is null or p.cpf = '');
