import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession } from '@/lib/stripe'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()
  const { academyId, planId } = body as { academyId?: string; planId?: 'starter' | 'pro' }

  if (!academyId || !planId || !['starter', 'pro'].includes(planId)) {
    return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
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

  const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? ''

  try {
    const session = await createCheckoutSession({
      academyId,
      planId,
      customerId: academy?.stripe_customer_id ?? undefined,
      successUrl: `${origin}/configuracoes?tab=plano&success=1`,
      cancelUrl: `${origin}/configuracoes?tab=plano`,
    })
    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
