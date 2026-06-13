import { NextResponse } from 'next/server'
import { z } from 'zod'

import { guardRoute } from '@/lib/api-guard'
import {
  verificationAdmin as admin,
  hashCode,
  VERIFY_MAX_ATTEMPTS,
} from '@/lib/email-verification'

const schema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Código deve ter 6 dígitos'),
})

// Valida o código de verificação e marca profiles.email_verified_at.
export async function POST(request: Request) {
  const guard = await guardRoute(request, schema)
  if (guard instanceof NextResponse) return guard
  const { user, body } = guard

  // Código mais recente não consumido.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rec } = await (admin.from('email_verifications') as any)
    .select('id, code_hash, expires_at, attempts, consumed_at')
    .eq('user_id', user.id)
    .is('consumed_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!rec) {
    return NextResponse.json({ error: 'Nenhum código ativo. Solicite um novo.' }, { status: 400 })
  }

  if (new Date(rec.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: 'Código expirado. Solicite um novo.' }, { status: 400 })
  }

  if (rec.attempts >= VERIFY_MAX_ATTEMPTS) {
    return NextResponse.json({ error: 'Muitas tentativas. Solicite um novo código.' }, { status: 429 })
  }

  if (hashCode(body.code) !== rec.code_hash) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin.from('email_verifications') as any)
      .update({ attempts: rec.attempts + 1 })
      .eq('id', rec.id)
    const left = VERIFY_MAX_ATTEMPTS - (rec.attempts + 1)
    return NextResponse.json(
      { error: left > 0 ? `Código incorreto. ${left} tentativa(s) restante(s).` : 'Código incorreto.' },
      { status: 400 },
    )
  }

  // Acerto: consome o código e marca o profile como verificado.
  const verifiedAt = new Date().toISOString()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin.from('email_verifications') as any)
    .update({ consumed_at: verifiedAt })
    .eq('id', rec.id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: updatedRows, error: updErr } = await (admin.from('profiles') as any)
    .update({ email_verified_at: verifiedAt })
    .eq('id', user.id)
    .select('id')

  if (updErr) {
    console.error('[verify-email] profile update error:', updErr)
    return NextResponse.json({ error: 'Erro ao confirmar. Tente de novo.' }, { status: 500 })
  }

  // O trigger handle_new_user NÃO cria a linha de profiles de forma confiável
  // (migration 038: 8 de 13 users ficaram sem profile). Se o UPDATE não pegou
  // nenhuma linha, o profile ainda não existe — criamos agora a partir do
  // metadata do auth. Sem isso a verificação "passa" mas email_verified_at
  // nunca persiste, e o usuário trava pra sempre no gate de /api/academy.
  if (!updatedRows || updatedRows.length === 0) {
    const { data: au } = await admin.auth.admin.getUserById(user.id)
    const meta = (au.user?.user_metadata ?? {}) as { full_name?: string }
    const fallbackName = meta.full_name ?? (au.user?.email ? au.user.email.split('@')[0] : null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: upsertErr } = await (admin.from('profiles') as any)
      .upsert({ id: user.id, email: au.user?.email ?? null, full_name: fallbackName, email_verified_at: verifiedAt }, { onConflict: 'id' })
    if (upsertErr) {
      console.error('[verify-email] profile upsert error:', upsertErr)
      return NextResponse.json({ error: 'Erro ao confirmar. Tente de novo.' }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}
