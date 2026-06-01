import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const admin = createAdminClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')?.trim() ?? ''

  if (!token) return NextResponse.json({ error: 'Token obrigatório' }, { status: 400 })

  const { data, error } = await admin
    .from('invites')
    .select('code, role, expires_at, uses_count, uses_limit, is_active, academy:academies(name, slug)')
    .eq('token', token)
    .eq('is_active', true)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Convite não encontrado ou expirado' }, { status: 404 })
  }

  const academy = data.academy as { name: string; slug: string } | null
  if (!academy) return NextResponse.json({ error: 'Academia não encontrada' }, { status: 404 })

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Este convite expirou' }, { status: 410 })
  }

  if (data.uses_limit && data.uses_count >= data.uses_limit) {
    return NextResponse.json({ error: 'Este convite já foi utilizado' }, { status: 409 })
  }

  return NextResponse.json({
    code: data.code,
    role: data.role as 'personal' | 'student',
    expiresAt: data.expires_at as string | null,
    usesCount: (data.uses_count as number) ?? 0,
    academyName: academy.name,
    academySlug: academy.slug,
  })
}
