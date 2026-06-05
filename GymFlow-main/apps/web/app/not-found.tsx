'use client'

import Link from 'next/link'
import { ArrowLeft, Home } from 'lucide-react'

import { BrandLogo } from '@/components/layout/brand-logo'
import { useAuthStore } from '@/stores/auth-store'

export default function NotFound() {
  const profile = useAuthStore((s) => s.profile)
  const homeHref = profile ? '/dashboard' : '/'

  return (
    <div className="relative min-h-screen bg-background bg-mesh flex flex-col items-center justify-center px-4">
      <div
        className="fixed inset-0 pointer-events-none z-[45]"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 80% 75% at 50% 50%, transparent 45%, rgba(0,0,0,0.55) 100%)',
        }}
      />

      <div className="relative z-10 text-center space-y-8 max-w-md">
        {/* Logo (link smart: leva pra /dashboard se logado, / se não) */}
        <BrandLogo size="xl" />

        {/* Error code */}
        <div className="space-y-3">
          <p
            className="text-[9rem] font-display font-extrabold leading-none tabular-nums"
            style={{
              background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 50%, #4f46e5 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            404
          </p>
          <h1 className="text-2xl font-display font-bold">Página não encontrada</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            A página que você está procurando não existe ou foi movida.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={homeHref}
            className="inline-flex items-center gap-2 btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold"
          >
            <Home className="w-4 h-4" />
            {profile ? 'Ir para o dashboard' : 'Ir para o início'}
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold border border-border/60 text-muted-foreground hover:text-foreground hover:border-border transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
        </div>
      </div>
    </div>
  )
}
