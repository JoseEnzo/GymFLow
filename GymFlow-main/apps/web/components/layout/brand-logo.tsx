'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Dumbbell } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

// Logo + nome da marca. Sempre clicável. Decide o destino conforme sessão:
// - logado: /dashboard
// - não logado: /
//
// Variantes:
//   size="sm"  → 24px ícone + texto sm   (sidebar collapsed, footers)
//   size="md"  → 28px ícone + texto base (sidebar normal, navbar dashboard)
//   size="lg"  → 32px ícone + texto lg   (header landing/auth)
//   size="xl"  → 40px ícone + texto xl   (hero, not-found)
//
// Use `showText={false}` em telas muito pequenas (mostra só o ícone).

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  className?: string
}

const SIZES = {
  sm: { box: 'w-6 h-6',  icon: 'w-3 h-3',     text: 'text-sm'   },
  md: { box: 'w-7 h-7',  icon: 'w-3.5 h-3.5', text: 'text-base' },
  lg: { box: 'w-8 h-8',  icon: 'w-4 h-4',     text: 'text-lg'   },
  xl: { box: 'w-10 h-10', icon: 'w-5 h-5',    text: 'text-xl'   },
}

export function BrandLogo({ size = 'md', showText = true, className }: BrandLogoProps) {
  // useAuthStore é seguro no client; quando ainda não hidratou, profile é null
  // e o link aponta pra "/", o que é o comportamento certo enquanto carrega.
  const profile = useAuthStore((s) => s.profile)
  const href = profile?.email_verified_at ? '/dashboard' : '/'

  const pathname = usePathname()
  const router = useRouter()

  // Já estamos no destino do logo → o <Link> não navegaria (mesma rota) e
  // ficaríamos parados onde estamos. Volta pro topo e atualiza a página.
  const handleClick = (e: React.MouseEvent) => {
    if (pathname === href) {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: 'smooth' })
      router.refresh()
    }
  }

  const sz = SIZES[size]

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={cn('inline-flex items-center gap-2 group', className)}
      aria-label="MeuTrein — voltar"
    >
      <div className={cn('relative flex items-center justify-center', sz.box)}>
        <div className="absolute inset-0 rounded-lg bg-brand-500 blur-sm opacity-50 group-hover:opacity-70 transition-opacity" />
        <div className={cn('relative rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center', sz.box)}>
          <Dumbbell className={cn('text-white', sz.icon)} />
        </div>
      </div>
      {showText && (
        <span className={cn('font-display font-bold tracking-tight', sz.text)}>
          Meu<span className="text-brand-400">Trein</span>
        </span>
      )}
    </Link>
  )
}
