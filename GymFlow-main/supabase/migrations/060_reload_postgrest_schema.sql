-- ============================================================
-- GymFlow — Reload do schema cache do PostgREST
-- Após criar as RPCs 056/057/058/059, PostgREST pode estar com
-- schema cache stale e retornar 404 vazio. Esse NOTIFY força o
-- reload imediato.
-- ============================================================

notify pgrst, 'reload schema';
