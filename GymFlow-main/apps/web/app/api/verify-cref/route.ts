import { NextResponse } from 'next/server'

import { verifyCREF } from '@/lib/cref'
import { clientIp } from '@/lib/turnstile'
import { rateLimit, tooManyRequests, RATE_LIMITS } from '@/lib/rate-limit'

// Verificação REAL do CREF no conselho regional, usada no /cadastro do personal.
// Roda server-side pra evitar CORS e poder manipular Cookie/anti-forgery do
// portal do conselho. Rota pública (cadastro é pré-sessão) protegida por rate
// limit por IP — a consulta faz fetch externo, então não pode ser martelada.
//
// runtime nodejs é obrigatório: o verificador seta o header `Cookie` na chamada
// ao portal, e na Edge runtime `Cookie` é header proibido (seria removido).
export const runtime = 'nodejs'

export async function POST(request: Request) {
  const rl = rateLimit(`verify-cref:${clientIp(request)}`, RATE_LIMITS.checkDocument)
  if (!rl.success) return tooManyRequests(rl.retryAfterSec)

  let body: { cref?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const cref = (body.cref ?? '').trim()
  if (!cref) {
    return NextResponse.json({ error: 'cref obrigatório' }, { status: 400 })
  }

  try {
    const result = await verifyCREF(cref)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[verify-cref] erro', err)
    // Falha de infra não deve travar o cadastro (CREF é opcional) — devolve
    // estado "não verificável" pro cliente decidir como tratar.
    return NextResponse.json({ status: 'unverifiable' })
  }
}
