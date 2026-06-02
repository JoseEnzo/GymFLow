import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

import { guardRoute } from '@/lib/api-guard'

const admin = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const schema = z.object({
  userId: z.string().uuid('userId inválido'),
  academyId: z.string().uuid('academyId inválido'),
  reason: z.string().min(5, 'Motivo deve ter ao menos 5 caracteres'),
  role: z.enum(['student', 'personal']),
})

export async function DELETE(request: Request) {
  const result = await guardRoute(request, schema)
  if (result instanceof NextResponse) return result
  const { user, body } = result

  // Verify requester is owner of the academy
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: membership } = await (admin as any)
    .from('academy_members')
    .select('role')
    .eq('academy_id', body.academyId)
    .eq('user_id', user.id)
    .eq('role', 'owner')
    .maybeSingle()

  if (!membership) {
    return NextResponse.json({ error: 'Sem permissão para excluir membros desta academia' }, { status: 403 })
  }

  // Prevent deleting yourself
  if (body.userId === user.id) {
    return NextResponse.json({ error: 'Não é possível excluir sua própria conta' }, { status: 400 })
  }

  // Verify target user actually belongs to this academy with the expected role
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: targetMember } = await (admin as any)
    .from('academy_members')
    .select('user_id')
    .eq('academy_id', body.academyId)
    .eq('user_id', body.userId)
    .eq('role', body.role)
    .maybeSingle()

  if (!targetMember) {
    return NextResponse.json({ error: 'Membro não encontrado nesta academia' }, { status: 404 })
  }

  // Delete user from auth — cascades to profiles, academy_members, workout_sheets, workout_logs
  const { error: deleteError } = await admin.auth.admin.deleteUser(body.userId)
  if (deleteError) {
    console.error('[members/delete] deleteUser error:', deleteError)
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
