/**
 * POST /api/turnstile
 * Verifica token do Cloudflare Turnstile server-side.
 * Nunca confiar no resultado do cliente — sempre verificar aqui.
 */
import { NextResponse } from 'next/server'
import { turnstileVerifySchema } from '@/lib/validations'
import { limiters } from '@/lib/rate-limit'

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export async function POST(request: Request) {
  // Rate limit por IP: 5 tentativas por 15 min (mesmo limiter do fluxo de auth)
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'

  const { success: rateLimitOk } = await limiters.auth.limit(ip)
  if (!rateLimitOk) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Aguarde 15 minutos antes de tentar novamente.' },
      { status: 429 },
    )
  }

  // Parse body
  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = turnstileVerifySchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Token obrigatório' }, { status: 422 })
  }

  const secretKey = process.env['TURNSTILE_SECRET_KEY']
  if (!secretKey) {
    // Se não configurado, deixa passar (para dev sem Turnstile)
    return NextResponse.json({ success: true })
  }

  const form = new URLSearchParams()
  form.set('secret', secretKey)
  form.set('response', parsed.data.token)
  if (ip) form.set('remoteip', ip)

  const res = await fetch(VERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  })

  interface TurnstileResponse {
    success: boolean
    'error-codes'?: string[]
  }

  const data = await res.json() as TurnstileResponse

  if (!data.success) {
    return NextResponse.json(
      { error: 'Verificação de segurança falhou. Tente novamente.', codes: data['error-codes'] },
      { status: 403 }
    )
  }

  return NextResponse.json({ success: true })
}
