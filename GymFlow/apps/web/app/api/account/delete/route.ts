import { NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api-guard'
import { createAdminClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit-log'

export async function DELETE(request: Request) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  if ((rawBody as Record<string, unknown>)?.confirmation !== 'EXCLUIR') {
    return NextResponse.json({ error: 'Confirmação inválida' }, { status: 422 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = await createAdminClient() as any

  // academies.owner_id tem ON DELETE RESTRICT — precisa deletar a academia antes do usuário
  const { data: owned } = await admin
    .from('academies')
    .select('id')
    .eq('owner_id', auth.id)

  if (owned?.length) {
    const { error } = await admin
      .from('academies')
      .delete()
      .in('id', (owned as { id: string }[]).map((a) => a.id))

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao remover academia. Transfira a propriedade antes de excluir a conta.' },
        { status: 409 },
      )
    }
  }

  // Audit antes de deletar (user_id some após a deleção)
  const ip = (request as unknown as Request & { headers: Headers }).headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined
  writeAuditLog(auth.id, 'account.delete', { ip })

  // Deleta auth.users → cascata: profiles, academy_members, workout_logs, set_logs, bioimpedance, body_measurements
  const { error: deleteError } = await admin.auth.admin.deleteUser(auth.id)
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
