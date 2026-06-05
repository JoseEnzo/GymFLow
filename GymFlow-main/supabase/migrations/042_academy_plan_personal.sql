-- 042_academy_plan_personal.sql
--
-- Adiciona valor 'personal' ao enum academy_plan.
--
-- Contexto: o modelo de tenancy admite três tipos de "owner":
--   - 'personal' → personal trainer solo (R$ 97/mês, alunos ilimitados, sem sub-personais)
--   - 'starter'  → academia pequena (R$ 197/mês, até 50 alunos, até 3 personais)
--   - 'pro'      → academia ilimitada (R$ 397/mês)
--
-- Frontend (/onboarding) e API (/api/academy + lib/stripe.ts) já tratavam 'personal',
-- mas o INSERT em academies.plan = 'personal' falhava silenciosamente porque o enum
-- só aceitava ('free', 'starter', 'pro'). Esta migration corrige a inconsistência.
--
-- ATENÇÃO: ALTER TYPE ... ADD VALUE não pode rodar dentro de transação. Se você usa
-- ferramentas que envolvem migrations em BEGIN/COMMIT, rode este arquivo isoladamente.

ALTER TYPE academy_plan ADD VALUE IF NOT EXISTS 'personal' BEFORE 'pro';
