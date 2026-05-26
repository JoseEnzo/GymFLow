import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { createCustomerPortalSession } from '@/lib/stripe'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()
  const { academyId } = body as { academyId?: string }

  if (!academyId) {
    return NextResponse.json({ error: 'academyId obrigatório' }, { status: 400 })
  }

  const { data: member } = await supabase
    .from('academy_members')
    .select('role')
    .eq('academy_id', academyId)
    .eq('user_id', user.id)
    .single()

  if (!member || member.role !== 'owner') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const { data: academy } = await supabase
    .from('academies')
    .select('stripe_customer_id')
    .eq('id', academyId)
    .single()

  if (!academy?.stripe_customer_id) {
    return NextResponse.json({ error: 'Nenhuma assinatura encontrada' }, { status: 400 })
  }

  const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? ''

  try {
    const session = await createCustomerPortalSession(
      academy.stripe_customer_id,
      `${origin}/configuracoes?tab=plano`
    )
    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
