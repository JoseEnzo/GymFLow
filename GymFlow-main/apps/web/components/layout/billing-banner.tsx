'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AlertTriangle, CreditCard } from 'lucide-react'

import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'

/**
 * Banner de pendência de cobrança. Montado no `(dashboard)/layout.tsx`,
 * acima do conteúdo (não-fixed, pra não brigar com o OfflineSyncProvider).
 *
 * Só o owner vê (cliente pagante é a academia — aluno/personal nunca recebem
 * nag de billing). Estados cobertos:
 * - sem subscription + plano pago → checkout abandonado ("finalize o pagamento")
 * - past_due → cartão falhou
 * - canceled → assinatura cancelada
 *
 * Oculto em /configuracoes (o usuário já está na tela que resolve).
 */
export function BillingBanner() {
  const pathname = usePathname()
  const { currentAcademy, currentRole } = useAuthStore()

  if (currentRole !== 'owner' || !currentAcademy) return null
  if (pathname?.startsWith('/configuracoes')) return null

  const status = currentAcademy.subscription_status
  const paidPlan = currentAcademy.plan && currentAcademy.plan !== 'free'

  let message: string | null = null
  let tone: 'amber' | 'red' = 'amber'

  if (status === 'past_due') {
    message = 'O pagamento da assinatura falhou. Atualize seu cartão para não perder o acesso.'
    tone = 'red'
  } else if (status === 'canceled') {
    message = 'Sua assinatura foi cancelada. Reative para continuar usando todos os recursos.'
    tone = 'red'
  } else if (!status && paidPlan && !currentAcademy.stripe_subscription_id) {
    message = 'Falta concluir o pagamento do seu plano. Finalize para garantir seu acesso.'
    tone = 'amber'
  }

  if (!message) return null

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4 px-4 py-3 mb-4 rounded-xl border text-sm',
        tone === 'red'
          ? 'bg-destructive/10 border-destructive/25 text-red-300'
          : 'bg-amber-500/10 border-amber-500/25 text-amber-200',
      )}
      role="alert"
    >
      <AlertTriangle className="w-4 h-4 flex-shrink-0 hidden sm:block" />
      <p className="flex-1 leading-relaxed">{message}</p>
      <Link
        href="/configuracoes?tab=plano"
        className={cn(
          'inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors flex-shrink-0',
          tone === 'red'
            ? 'border-destructive/40 hover:bg-destructive/15'
            : 'border-amber-500/40 hover:bg-amber-500/15',
        )}
      >
        <CreditCard className="w-3.5 h-3.5" />
        Resolver agora
      </Link>
    </div>
  )
}
