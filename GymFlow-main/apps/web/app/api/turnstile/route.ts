/**
 * POST /api/turnstile
 * Verifica token do Cloudflare Turnstile server-side.
 * Decisão de aceitar ou não vive em lib/turnstile.ts (gate por NODE_ENV).
 */
import { NextResponse } from 'next/server'

import { turnstileVerifySchema } from '@/lib/validations'
import { verifyTurnstileToken, clientIp } from '@/lib/turnstile'

export async function POST(request: Request) {
  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = turnstileVerifySchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 422 })
  }

  const ok = await verifyTurnstileToken(parsed.data.token, clientIp(request))
  if (!ok) {
    return NextResponse.json(
      { error: 'Verificação de segurança falhou. Tente novamente.' },
      { status: 403 },
    )
  }

  return NextResponse.json({ success: true })
}
