import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession } from '@/lib/stripe'
import { guardRoute } from '@/lib/api-guard'
import { checkoutSchema } from '@/lib/validations'

export async function POST(request: Request) {
  const result = await guardRoute(request, checkoutSchema)
  if (result instanceof NextResponse) return result
  const { user, body: { academyId, planId } } = result

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

  const origin = request.headers.get('origin') ?? process.env['NEXT_PUBLIC_APP_URL'] ?? ''

  try {
    const session = await createCheckoutSession({
      academyId,
      planId,
      customerId: (academy as { stripe_customer_id: string | null } | null)?.stripe_customer_id ?? undefined,
      successUrl: `${origin}/configuracoes?tab=plano&success=1`,
      cancelUrl: `${origin}/configuracoes?tab=plano`,
    })
    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
