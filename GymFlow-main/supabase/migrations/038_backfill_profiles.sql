-- ============================================================
-- GymFlow — Backfill de profiles faltantes
-- ============================================================
-- O trigger handle_new_user (001/026/036) não gera a linha em
-- profiles de forma confiável no Supabase remoto: 8 de 13 usuários
-- do auth ficaram sem profile. Sem profile, o dono/personal não
-- conseguem ler o nome do aluno (a tela cai no fallback "Aluno"),
-- porque eles só leem a tabela profiles — não o metadata do auth.
--
-- Esta migration cria as linhas faltantes a partir do metadata.
-- Só preenche campos SEM unique constraint (full_name, email,
-- avatar_url) para nunca falhar por cpf/cref duplicado. O cpf/cref
-- é gravado no 1º login pelo app (use-auth.ts) ou pelo usuário no
-- perfil. Idempotente: roda quantas vezes precisar.
-- ============================================================

insert into public.profiles (id, full_name, avatar_url, email)
select
  u.id,
  coalesce(nullif(u.raw_user_meta_data ->> 'full_name', ''), split_part(u.email, '@', 1)),
  u.raw_user_meta_data ->> 'avatar_url',
  u.email
from auth.users u
where not exists (
  select 1 from public.profiles p where p.id = u.id
);
