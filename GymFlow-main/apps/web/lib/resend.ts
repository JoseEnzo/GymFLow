import { Resend } from 'resend'

// Server-side only. NEVER import this from a client component.
// RESEND_API_KEY vem do Doppler em prod; em dev local com Doppler também.
// Sem a key, qualquer call falha em runtime (intencional — não quero envio
// silencioso vazando log em desenvolvimento).
const apiKey = process.env['RESEND_API_KEY']

export const resend = apiKey ? new Resend(apiKey) : null

// Sandbox por enquanto: domínio resend.dev funciona sem validar SPF/DKIM.
// Trocar pra noreply@<dominio-validado> quando o domínio for verificado no Resend.
export const FROM_EMAIL = process.env['RESEND_FROM_EMAIL'] ?? 'MeuTrein <onboarding@resend.dev>'

export function isResendConfigured(): boolean {
  return resend !== null
}
