'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AlertCircle, ArrowRight } from 'lucide-react'

import { useAuthStore } from '@/stores/auth-store'
import type { Academy, MemberRole, Profile } from '@/types'

/**
 * Aviso de cadastro incompleto. Montado no `(dashboard)/layout.tsx`, logo abaixo
 * do BillingBanner. Vale pra todos os papéis: lista os dados que faltam e leva o
 * usuário direto pra tela onde preenche. Some sozinho quando tudo está completo.
 *
 * Dados verificados por papel (e onde se corrigem):
 * - student  → perfil: nome, telefone, data de nascimento     (/perfil)
 * - personal → perfil: nome, telefone, especialidade          (/configuracoes?tab=perfil)
 * - owner    → academia: e-mail, telefone, cidade             (/configuracoes?tab=academia)
 *
 * Oculto em /perfil e /configuracoes (o usuário já está na tela que resolve).
 */
export function ProfileCompletionBanner() {
  const pathname = usePathname()
  const { profile, currentAcademy, currentRole } = useAuthStore()

  // Espera o profile hidratar (use-auth) pra não acusar "falta telefone" antes de carregar.
  if (!profile || !currentRole) return null
  if (pathname?.startsWith('/perfil') || pathname?.startsWith('/configuracoes')) return null

  const missing = getMissing(currentRole, profile, currentAcademy)
  if (!missing) return null

  const verb = missing.items.length === 1 ? 'Falta' : 'Faltam'

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4 px-4 py-3 mb-4 rounded-xl border border-amber-500/25 bg-amber-500/10 text-amber-200 text-sm"
      role="alert"
    >
      <AlertCircle className="w-4 h-4 flex-shrink-0 hidden sm:block" />
      <p className="flex-1 leading-relaxed">
        Sua conta está quase pronta! {verb}{' '}
        <span className="font-semibold">{formatList(missing.items)}</span>.
      </p>
      <Link
        href={missing.href}
        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-amber-500/40 hover:bg-amber-500/15 transition-colors flex-shrink-0"
      >
        Completar agora
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  )
}

type MissingInfo = { items: string[]; href: string }

function getMissing(
  role: MemberRole,
  profile: Profile,
  academy: Academy | null,
): MissingInfo | null {
  const filled = (v: string | null | undefined) => !!v && v.trim().length > 0

  if (role === 'student') {
    const items: string[] = []
    if (!filled(profile.full_name)) items.push('seu nome completo')
    if (!filled(profile.phone)) items.push('seu telefone')
    if (!profile.birth_date) items.push('sua data de nascimento')
    return items.length ? { items, href: '/perfil' } : null
  }

  if (role === 'personal') {
    const items: string[] = []
    if (!filled(profile.full_name)) items.push('seu nome completo')
    if (!filled(profile.phone)) items.push('seu telefone')
    if (!filled(profile.specialty)) items.push('sua especialidade')
    return items.length ? { items, href: '/configuracoes?tab=perfil' } : null
  }

  if (role === 'owner') {
    if (!academy) return null
    const items: string[] = []
    if (!filled(academy.email)) items.push('o e-mail da academia')
    if (!filled(academy.phone)) items.push('o telefone da academia')
    if (!filled(academy.address_city)) items.push('a cidade da academia')
    return items.length ? { items, href: '/configuracoes?tab=academia' } : null
  }

  return null
}

/** "a", "a e b", "a, b e c" */
function formatList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  return `${items.slice(0, -1).join(', ')} e ${items[items.length - 1]}`
}
