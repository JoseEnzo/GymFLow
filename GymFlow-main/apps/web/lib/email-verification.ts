// Lógica compartilhada da verificação de e-mail (OTP) entre as rotas
// send-verification e verify-email. Server-side only.
import { randomInt, createHash } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

export const VERIFY_CODE_TTL_MIN = 15
export const VERIFY_MAX_ATTEMPTS = 6
export const VERIFY_RESEND_COOLDOWN_SEC = 30

// Admin client (service role — bypassa RLS). email_verifications não tem policy,
// então só é acessível por aqui.
export const verificationAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

// 6 dígitos com zeros à esquerda. randomInt é uniforme e cripto-seguro.
export function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0')
}

// Guardamos só o hash — nunca o código em claro no banco.
export function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex')
}
