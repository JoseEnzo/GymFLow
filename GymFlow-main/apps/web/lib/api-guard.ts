/**
 * Helpers para proteger API routes: auth check + Zod parsing.
 *
 * Uso:
 *   const { user, body } = await guardedRoute(request, mySchema)
 *   if ('error' in user) return user   // NextResponse 401/400
 */
import { NextResponse } from 'next/server'
import type { ZodSchema, ZodError } from 'zod'

import { createClient } from '@/lib/supabase/server'

type GuardedOk<T> = { user: { id: string; email?: string }; body: T }
type GuardedErr = NextResponse

/**
 * Verifica autenticação e parseia o body com Zod.
 * Retorna { user, body } em caso de sucesso ou uma NextResponse de erro.
 */
export async function guardRoute<T>(
  request: Request,
  schema: ZodSchema<T>,
): Promise<GuardedOk<T> | GuardedErr> {
  // 1. Auth
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  // 2. Body size guard (≤ 64 KB para JSON)
  const contentLength = request.headers.get('content-length')
  if (contentLength && parseInt(contentLength, 10) > 64 * 1024) {
    return NextResponse.json({ error: 'Payload muito grande' }, { status: 413 })
  }

  // 3. Parse JSON safely
  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  // 4. Zod parse
  const result = schema.safeParse(rawBody)
  if (!result.success) {
    const firstError = (result.error as ZodError).errors[0]
    return NextResponse.json(
      { error: firstError?.message ?? 'Dados inválidos', field: firstError?.path.join('.') },
      { status: 422 },
    )
  }

  return { user: { id: user.id, email: user.email }, body: result.data }
}

/**
 * Verifica apenas autenticação (sem body).
 */
export async function requireAuth(): Promise<{ id: string; email?: string } | NextResponse> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  return { id: user.id, email: user.email }
}
