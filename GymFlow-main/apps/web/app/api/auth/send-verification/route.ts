import { NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api-guard'
import { resend, FROM_EMAIL, isResendConfigured } from '@/lib/resend'
import { emailVerificationEmail } from '@/lib/email-templates/email-verification'
import {
  verificationAdmin as admin,
  generateCode,
  hashCode,
  VERIFY_CODE_TTL_MIN,
  VERIFY_RESEND_COOLDOWN_SEC,
} from '@/lib/email-verification'

// Gera e envia (ou reenvia) o código de verificação pro e-mail do usuário logado.
export async function POST(request: Request) {
  const authResult = await requireAuth()
  if (authResult instanceof NextResponse) return authResult
  const user = authResult

  if (!user.email) {
    return NextResponse.json({ error: 'Conta sem e-mail.' }, { status: 400 })
  }

  // Já verificado → nada a fazer (idempotente; o client redireciona).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: prof } = await (admin.from('profiles') as any)
    .select('email_verified_at, full_name')
    .eq('id', user.id)
    .maybeSingle()

  if (prof?.email_verified_at) {
    return NextResponse.json({ ok: true, alreadyVerified: true })
  }

  if (!isResendConfigured()) {
    return NextResponse.json({ error: 'Envio de e-mail indisponível no momento.' }, { status: 503 })
  }

  // Cooldown anti-abuso: 1 envio a cada VERIFY_RESEND_COOLDOWN_SEC.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: last } = await (admin.from('email_verifications') as any)
    .select('created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (last?.created_at) {
    const elapsed = (Date.now() - new Date(last.created_at).getTime()) / 1000
    if (elapsed < VERIFY_RESEND_COOLDOWN_SEC) {
      return NextResponse.json(
        { error: 'Aguarde alguns segundos antes de pedir outro código.', retryAfter: Math.ceil(VERIFY_RESEND_COOLDOWN_SEC - elapsed) },
        { status: 429 },
      )
    }
  }

  const code = generateCode()
  const expiresAt = new Date(Date.now() + VERIFY_CODE_TTL_MIN * 60 * 1000).toISOString()

  // Invalida códigos anteriores não consumidos (só o último vale).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin.from('email_verifications') as any)
    .delete()
    .eq('user_id', user.id)
    .is('consumed_at', null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: insErr } = await (admin.from('email_verifications') as any).insert({
    user_id: user.id,
    code_hash: hashCode(code),
    expires_at: expiresAt,
  })

  if (insErr) {
    console.error('[send-verification] insert error:', insErr)
    return NextResponse.json({ error: 'Erro ao gerar código.' }, { status: 500 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin
  const firstName = (prof?.full_name as string | null)?.split(' ')[0] ?? 'tudo bem'
  const { subject, html, text } = emailVerificationEmail({
    name: firstName,
    code,
    verifyUrl: `${appUrl}/verificar-email`,
    expiresMinutes: VERIFY_CODE_TTL_MIN,
  })

  const result = await resend!.emails.send({
    from: FROM_EMAIL,
    to: user.email,
    subject,
    html,
    text,
  })

  if (result.error) {
    console.error('[send-verification] resend error:', result.error)
    return NextResponse.json({ error: 'Erro ao enviar o e-mail.' }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
