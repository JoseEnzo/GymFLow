-- 071_email_verification.sql
-- Verificação de e-mail via Resend (app-side, OTP de 6 dígitos).
--
-- Por que app-side e não confirmação nativa do Supabase: o cadastro atual loga
-- o usuário na hora (enable_confirmations = false) e segue pro /onboarding pra
-- criar academia. Ligar a confirmação nativa removeria a sessão até confirmar e
-- quebraria todo o fluxo de onboarding/criação de academia + tratamento de órfão.
-- Aqui a verificação é uma política da aplicação: gate em /verificar-email e na
-- criação de academia (/api/academy), sem mexer no Supabase Auth.

-- 1. Marca de verificação no profile (fonte da verdade do gate).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_verified_at timestamptz;

-- Grandfather: todo mundo que já existe é considerado verificado, senão
-- usuários em fluxo (e owners sem academia) ficariam travados de uma vez.
-- A partir daqui, signUp grava NULL e só vira timestamp após confirmar o código.
UPDATE public.profiles
  SET email_verified_at = now()
  WHERE email_verified_at IS NULL;

-- 2. Códigos de verificação. Guardamos só o HASH (sha256) do código — nunca o
-- código em claro. Acesso exclusivo via service_role (API routes): RLS ligada
-- sem nenhuma policy = authenticated não lê/escreve nada aqui.
CREATE TABLE IF NOT EXISTS public.email_verifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash   text NOT NULL,
  expires_at  timestamptz NOT NULL,
  attempts    int NOT NULL DEFAULT 0,
  consumed_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Lookup do código mais recente por usuário (verify) e cooldown de reenvio.
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_created
  ON public.email_verifications (user_id, created_at DESC);

ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;
-- Sem policies de propósito: só service_role (que bypassa RLS) toca esta tabela.
