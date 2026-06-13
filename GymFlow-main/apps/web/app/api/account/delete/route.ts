import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

import type { Database } from '@gymflow/database'
import { requireAuth } from '@/lib/api-guard'
import { stripe } from '@/lib/stripe'

// Admin client (service role — bypassa RLS). Necessário porque deletar
// auth.users e cascatear dados cross-tenant não é possível sob RLS.
const admin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

/**
 * POST /api/account/delete
 *
 * Exclui PERMANENTEMENTE a conta do usuário autenticado e libera
 * e-mail / CNPJ / CREF pra reuso imediato num novo cadastro.
 *
 * A ordem importa por causa das foreign keys (ver migration 001):
 *
 * 1. Academias das quais o user é DONO (`academies.owner_id` é ON DELETE
 *    RESTRICT — bloqueia o deleteUser enquanto existir). Antes de apagar,
 *    cancela a assinatura Stripe (best-effort) pra não cobrar conta morta.
 *    O delete da academia cascateia membros, fichas, treinos, convites,
 *    agenda, bioimpedância, dietas — e libera o CNPJ (`academies.cnpj`).
 *
 * 2. Zera as referências NO ACTION que ainda apontam pro user (senão o
 *    deleteUser falha por FK): `academy_members.invited_by` + `created_by`
 *    em `exercises` / `recipes` / `food_items` (itens de catálogo global
 *    que ele criou e que sobrevivem à exclusão da conta).
 *
 * 3. `admin.auth.admin.deleteUser` — remove a linha de auth.users
 *    (libera o e-mail e o `user_metadata.document` = CNPJ/CREF) e cascateia
 *    o profile (libera o CREF de `profiles.cref`), memberships restantes e
 *    todo o histórico de treino do usuário.
 */
export async function POST() {
  const authResult = await requireAuth()
  if (authResult instanceof NextResponse) return authResult
  const userId = authResult.id

  try {
    // 1. Academias que o usuário é dono.
    const { data: owned, error: ownedErr } = await admin
      .from('academies')
      .select('id, stripe_subscription_id')
      .eq('owner_id', userId)

    if (ownedErr) {
      console.error('[account/delete] load academias', ownedErr)
      return NextResponse.json({ error: 'Erro ao excluir a conta' }, { status: 500 })
    }

    for (const ac of owned ?? []) {
      if (ac.stripe_subscription_id && process.env['STRIPE_SECRET_KEY']) {
        try {
          await stripe.subscriptions.cancel(ac.stripe_subscription_id)
        } catch (e) {
          // Não-fatal: assinatura já cancelada/inexistente não impede a exclusão.
          console.error('[account/delete] cancelar assinatura', ac.stripe_subscription_id, e)
        }
      }
    }

    if (owned && owned.length > 0) {
      const ids = owned.map((a) => a.id)
      const { error: acErr } = await admin.from('academies').delete().in('id', ids)
      if (acErr) {
        console.error('[account/delete] delete academias', acErr)
        return NextResponse.json({ error: 'Erro ao excluir a academia' }, { status: 500 })
      }
    }

    // 2. Zera referências NO ACTION restantes (em academias de OUTROS donos).
    await admin.from('academy_members').update({ invited_by: null }).eq('invited_by', userId)
    await admin.from('exercises').update({ created_by: null }).eq('created_by', userId)
    await admin.from('recipes').update({ created_by: null }).eq('created_by', userId)
    await admin.from('food_items').update({ created_by: null }).eq('created_by', userId)

    // 3. Deleta o auth.user — cascateia o resto e libera e-mail/CNPJ/CREF.
    const { error: delErr } = await admin.auth.admin.deleteUser(userId)
    if (delErr) {
      console.error('[account/delete] deleteUser', delErr)
      return NextResponse.json({ error: 'Erro ao excluir a conta' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[account/delete] erro inesperado', err)
    return NextResponse.json({ error: 'Erro ao excluir a conta' }, { status: 500 })
  }
}
