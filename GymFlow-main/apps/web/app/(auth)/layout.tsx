import type { Metadata } from 'next'

import { BrandLogo } from '@/components/layout/brand-logo'

export const metadata: Metadata = {
  title: 'Acesso',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left — form */}
      <div className="relative flex flex-col items-center justify-center p-8 bg-background">
        {/* Logo (link smart) */}
        <div className="absolute top-8 left-8">
          <BrandLogo size="sm" />
        </div>

        <div className="w-full max-w-sm">
          {children}
        </div>
      </div>

      {/* Right — visual */}
      <div className="hidden lg:flex flex-col items-center justify-center relative overflow-hidden bg-surface-50 border-l border-border/40">
        {/* Background effects */}
        <div className="absolute inset-0 bg-mesh" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(99,102,241,1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(99,102,241,1) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)' }} />

        <div className="relative z-10 text-center px-12 space-y-6 max-w-md">
          {/* Mock stats widget */}
          <div className="glass rounded-2xl p-6 text-left mb-8 shadow-glow border border-brand-500/15">
            <p className="text-xs text-muted-foreground font-medium mb-4">Atividade hoje</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { v: '38', l: 'Treinos', c: '#6366F1' },
                { v: '247', l: 'Alunos', c: '#10B981' },
              ].map(({ v, l, c }) => (
                <div key={l} className="rounded-xl p-3"
                  style={{ background: `${c}10`, border: `1px solid ${c}25` }}>
                  <p className="font-display font-extrabold text-2xl" style={{ color: c }}>{v}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{l}</p>
                </div>
              ))}
            </div>
            <div className="flex items-end gap-1.5 h-12">
              {[50,70,45,85,60,90,75].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded"
                  style={{
                    height: `${h}%`,
                    background: 'linear-gradient(to top, #6366F1, #818CF8)',
                  }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-5xl">💪</div>
            <h2 className="text-3xl font-display font-extrabold">
              Sua academia no
              <span className="block gradient-text">próximo nível</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Feito pra academia pequena — onde o dono conhece cada aluno.
            </p>
          </div>

          {/* Stars */}
          <div className="flex items-center justify-center gap-1.5">
            {[1,2,3,4,5].map((s) => (
              <div key={s} className="w-5 h-5 rounded-full bg-amber-400/20 flex items-center justify-center">
                <span className="text-amber-400 text-xs">★</span>
              </div>
            ))}
            <span className="text-sm text-muted-foreground ml-2">4.9/5 de avaliação</span>
          </div>
        </div>
      </div>
    </div>
  )
}
