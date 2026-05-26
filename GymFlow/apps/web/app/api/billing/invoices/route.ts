import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const academyId = searchParams.get('academyId')

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
    .select('stripe_customer_id, stripe_subscription_id')
    .eq('id', academyId)
    .single()

  if (!academy?.stripe_customer_id) {
    return NextResponse.json({ invoices: [], periodEnd: null, trialEnd: null })
  }

  try {
    const [invoiceList, subscription] = await Promise.all([
      stripe.invoices.list({ customer: academy.stripe_customer_id, limit: 5 }),
      academy.stripe_subscription_id
        ? stripe.subscriptions.retrieve(academy.stripe_subscription_id)
        : null,
    ])

    const invoices = invoiceList.data.map((inv) => ({
      id: inv.id,
      date: inv.created,
      amount: inv.amount_paid,
      status: inv.status,
      pdfUrl: inv.invoice_pdf,
    }))

    const periodEnd = subscription
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null

    const trialEnd = subscription?.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null

    return NextResponse.json({ invoices, periodEnd, trialEnd })
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
