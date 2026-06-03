import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { createCustomerPortalSession } from '@/lib/stripe'
import { guardRoute } from '@/lib/api-guard'
import { portalSchema } from '@/lib/validations'

export async function POST(request: Request) {
  const result = await guardRoute(request, portalSchema)
  if (result instanceof NextResponse) return result
  const { user, body: { academyId } } = result

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any

  const { data: member } = await supabase
    .from('academy_members')
    .select('role')
    .eq('academy_id', academyId)
    .eq('user_id', user.id)
    .single()

  if (!member || (member as { role: string }).role !== 'owner') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const { data: academy } = await supabase
    .from('academies')
    .select('stripe_customer_id')
    .eq('id', academyId)
    .single()

  const ac = academy as { stripe_customer_id: string | null } | null

  if (!ac?.stripe_customer_id) {
    return NextResponse.json({ error: 'Nenhuma assinatura encontrada' }, { status: 400 })
  }

  const origin = request.headers.get('origin') ?? process.env['NEXT_PUBLIC_APP_URL'] ?? ''

  try {
    const session = await createCustomerPortalSession(
      ac.stripe_customer_id,
      `${origin}/configuracoes?tab=plano`
    )
    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    console.error('[billing/portal]', err)
    return NextResponse.json({ error: 'Erro ao acessar portal de pagamento' }, { status: 500 })
  }
}
