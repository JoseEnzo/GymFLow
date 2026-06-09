import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

import { guardRoute } from '@/lib/api-guard'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const schema = z.object({
  memberId: z.string().uuid('memberId inválido'),
  academyId: z.string().uuid('academyId inválido'),
})

// Remove SÓ o vínculo do membro com a academia (linha em academy_members).
// A conta, o perfil, o histórico de treinos e vínculos com OUTRAS academias do
// usuário são preservados — alinhado com a intenção da migration 037.
//
// Roda com service_role de propósito: assim a remoção funciona mesmo que a
// policy 037 (DELETE em academy_members) ainda não esteja aplicada no banco,
// sem depender de RLS. A autorização é feita aqui no handler.
export async function DELETE(request: Request) {
  const result = await guardRoute(request, schema)
  if (result instanceof NextResponse) return result
  const { user, body } = result

  // 1. Quem pede precisa ser owner ATIVO da academia.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: requester } = await (admin as any)
    .from('academy_members')
    .select('role')
    .eq('academy_id', body.academyId)
    .eq('user_id', user.id)
    .eq('role', 'owner')
    .eq('is_active', true)
    .maybeSingle()

  if (!requester) {
    return NextResponse.json({ error: 'Sem permissão para remover membros desta academia' }, { status: 403 })
  }

  // 2. Carrega o membro alvo e valida que pertence a ESTA academia.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: target } = await (admin as any)
    .from('academy_members')
    .select('id, user_id, role')
    .eq('id', body.memberId)
    .eq('academy_id', body.academyId)
    .maybeSingle()

  if (!target) {
    return NextResponse.json({ error: 'Membro não encontrado nesta academia' }, { status: 404 })
  }
  if (target.role === 'owner') {
    return NextResponse.json({ error: 'Não é possível remover o dono da academia' }, { status: 400 })
  }
  if (target.user_id === user.id) {
    return NextResponse.json({ error: 'Não é possível remover você mesmo' }, { status: 400 })
  }

  // 3. Apaga apenas o vínculo. expulsion_requests.student_member_id é
  // ON DELETE CASCADE, então pedidos pendentes do membro somem junto.
  const { error } = await admin
    .from('academy_members')
    .delete()
    .eq('id', body.memberId)
    .eq('academy_id', body.academyId)

  if (error) {
    console.error('[members/delete]', error)
    return NextResponse.json({ error: 'Erro ao remover membro' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
