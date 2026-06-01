import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

import { requireAuth } from '@/lib/api-guard'

const admin = createAdminClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: Request) {
  const authResult = await requireAuth()
  if (authResult instanceof NextResponse) return authResult
  const user = authResult

  let token: string
  try {
    const body = await request.json() as { token?: string }
    token = body.token?.trim() ?? ''
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  if (!token) return NextResponse.json({ error: 'Token obrigatório' }, { status: 400 })

  // Busca convite com dados da academia
  const { data: invite, error: inviteError } = await admin
    .from('invites')
    .select('*, academy:academies(id, name, slug)')
    .eq('token', token)
    .eq('is_active', true)
    .single()

  if (inviteError || !invite) {
    return NextResponse.json({ error: 'Convite não encontrado ou expirado' }, { status: 404 })
  }

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Este convite expirou' }, { status: 410 })
  }

  if (invite.uses_limit && invite.uses_count >= invite.uses_limit) {
    return NextResponse.json({ error: 'Este convite já foi utilizado' }, { status: 409 })
  }

  const academy = invite.academy as { id: string; name: string; slug: string } | null
  if (!academy) {
    return NextResponse.json({ error: 'Academia não encontrada' }, { status: 404 })
  }

  // Insere ou atualiza membro
  const { error: memberError } = await admin
    .from('academy_members')
    .upsert({
      academy_id: academy.id,
      user_id: user.id,
      role: invite.role as string,
      is_active: true,
      joined_at: new Date().toISOString(),
      invited_by: invite.created_by ?? null,
    }, { onConflict: 'academy_id,user_id' })

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 })
  }

  // Incrementa contador de usos
  await admin
    .from('invites')
    .update({ uses_count: (invite.uses_count ?? 0) + 1 })
    .eq('token', token)

  return NextResponse.json({
    academyName: academy.name,
    academySlug: academy.slug,
    role: invite.role,
  })
}
