-- ============================================================
-- Cleanup: remove auth.user órfão (owner sem nenhuma academia).
-- Causa: onboarding falhou ao criar academia (CNPJ duplicado etc.)
-- e o /api/academy não removia o auth.user — ficava como zombie
-- bloqueando o CNPJ pra todas as próximas tentativas.
--
-- Fix do bug em api/academy/route.ts (cleanup automático no 409)
-- entra junto. Esta migration é só pra limpar o estado atual.
--
-- Critério: account_type='owner' E zero academies vinculadas.
-- Específico do estado em prod 2026-06-08 (1 órfão identificado).
-- ============================================================

delete from auth.users
where raw_user_meta_data->>'account_type' = 'owner'
  and id not in (select owner_id from academies)
  and created_at < now() - interval '1 hour';  -- safety: não toca em signup recente
