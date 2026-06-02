'use client'

import React from 'react'
import { Loader2, Github, Facebook, Gitlab, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type Provider = 'google' | 'facebook' | 'github' | 'gitlab'

const PROVIDERS: { key: Provider; label: string; icon: React.ReactNode; btn: string; iconBg: string }[] = [
  {
    key: 'google',
    label: 'Gmail',
    btn: 'bg-red-500/5 border-red-500/20 text-foreground hover:bg-red-500/10 hover:border-red-500/30',
    iconBg: 'bg-red-500/10',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    ),
  },
  { key: 'facebook', label: 'Facebook', btn: 'bg-blue-500/5 border-blue-500/20 text-foreground hover:bg-blue-500/10 hover:border-blue-500/30',     iconBg: 'bg-blue-500/10',   icon: <Facebook className="w-5 h-5 text-[#1877F2]" /> },
  { key: 'github',   label: 'GitHub',   btn: 'bg-surface-100 border-border/60 text-foreground hover:bg-surface-200 hover:border-border',              iconBg: 'bg-white/6',       icon: <Github   className="w-5 h-5 text-foreground" /> },
  { key: 'gitlab',   label: 'GitLab',   btn: 'bg-orange-500/5 border-orange-500/20 text-foreground hover:bg-orange-500/10 hover:border-orange-500/30', iconBg: 'bg-orange-500/10', icon: <Gitlab   className="w-5 h-5 text-[#FC6D26]" /> },
]

interface SocialButtonsProps {
  onLogin: (provider: Provider) => Promise<void>
  label?: string
}

export function SocialButtons({ onLogin, label = 'Continuar com' }: SocialButtonsProps) {
  const [loading, setLoading] = React.useState<Provider | null>(null)

  async function handle(provider: Provider) {
    setLoading(provider)
    try { await onLogin(provider) }
    catch {
      const name = PROVIDERS.find(p => p.key === provider)?.label ?? provider
      toast.error(`Erro ao entrar com ${name}`)
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-col gap-2.5">
      {PROVIDERS.map(({ key, label: name, icon, btn, iconBg }) => (
        <button
          key={key}
          type="button"
          onClick={() => handle(key)}
          disabled={loading !== null}
          className={cn(
            'group flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 font-medium disabled:opacity-50 hover:-translate-y-0.5',
            btn
          )}
        >
          {loading === key ? (
            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
          ) : (
            <>
              <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', iconBg)}>
                {icon}
              </span>
              <span className="flex-1 text-sm text-left">{label} <strong>{name}</strong></span>
              <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-80 group-hover:translate-x-0.5 transition-all" />
            </>
          )}
        </button>
      ))}
    </div>
  )
}
