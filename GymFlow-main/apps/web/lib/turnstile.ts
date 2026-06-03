/**
 * Verificação server-side do token Cloudflare Turnstile.
 *
 * Comportamento:
 * - TURNSTILE_SECRET_KEY ausente + NODE_ENV=production → sempre falha (config ruim em prod).
 * - TURNSTILE_SECRET_KEY ausente + dev → passa (DX: não trava login local sem Cloudflare).
 * - TURNSTILE_SECRET_KEY presente → consulta Cloudflare; token vazio/inválido → falha.
 */
const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export async function verifyTurnstileToken(
  token: string,
  ip: string | undefined,
): Promise<boolean> {
  const secretKey = process.env['TURNSTILE_SECRET_KEY']
  if (!secretKey) {
    return process.env.NODE_ENV !== 'production'
  }

  // Token vazio nunca passa quando secret está configurado.
  if (!token) return false

  const form = new URLSearchParams()
  form.set('secret', secretKey)
  form.set('response', token)
  if (ip) form.set('remoteip', ip)

  try {
    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    })
    const data = (await res.json()) as { success: boolean }
    return data.success === true
  } catch {
    return false
  }
}

export function clientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}
