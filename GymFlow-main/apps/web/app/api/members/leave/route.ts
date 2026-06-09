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
  academyId: z.string().uuid('academyId inválido'),
})

// Self-leave: o próprio usuário (personal ou aluno) remove seu vínculo de uma
// academia. Owner não pode sair — precisa transferir a academia ou deletar.
//
// Pareado com /api/members/delete (owner remove outros). Cada rota cobre um
// vetor diferente de autorização — não dá pra unificar sem perder clareza.
export async function POST(request: Request) {
  const result = await guardRoute(request, schema)
  if (result instanceof NextResponse) return result
  const { user, body } = result

  // Carrega o membership do próprio usuário na academia alvo.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: membership } = await (admin as any)
    .from('academy_members')
    .select('id, role')
    .eq('academy_id', body.academyId)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle()

  if (!membership) {
    return NextResponse.json({ error: 'Você não faz parte desta academia' }, { status: 404 })
  }

  if (membership.role === 'owner') {
    return NextResponse.json(
      { error: 'O dono não pode sair da própria academia. Transfira a propriedade ou exclua a academia.' },
      { status: 400 },
    )
  }

  // Deleta o vínculo. CASCADE em expulsion_requests e similares limpa o resto.
  const { error } = await admin
    .from('academy_members')
    .delete()
    .eq('id', membership.id)

  if (error) {
    console.error('[members/leave]', error)
    return NextResponse.json({ error: 'Erro ao sair da academia' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
