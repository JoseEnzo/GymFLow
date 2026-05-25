'use client'

import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Menu, Bell, Search, Plus } from 'lucide-react'

import { useUIStore } from '@/stores/ui-store'
import { useAuthStore } from '@/stores/auth-store'
import { useAuth } from '@/hooks/use-auth'
import { getInitials } from '@/lib/utils'
import { cn } from '@/lib/utils'

const BREADCRUMBS: Record<string, { label: string; parent?: string }> = {
  '/dashboard': { label: 'Dashboard' },
  '/alunos': { label: 'Alunos' },
  '/treinos': { label: 'Treinos' },
  '/exercicios': { label: 'Exercícios' },
  '/frequencia': { label: 'Frequência' },
  '/configuracoes': { label: 'Configurações' },
}

function getPageTitle(pathname: string) {
  const exact = BREADCRUMBS[pathname]
  if (exact) return exact.label

  for (const [key, val] of Object.entries(BREADCRUMBS)) {
    if (pathname.startsWith(key + '/')) return val.label
  }

  return 'GymFlow'
}

export function Header() {
  const pathname = usePathname()
  const { setSidebarOpen } = useUIStore()
  const { profile } = useAuth()
  const { currentAcademy } = useAuthStore()
  const title = getPageTitle(pathname)

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 sm:px-6 border-b border-border/40 bg-background/80 backdrop-blur-xl"
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-100 transition-all"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Page title */}
        <div>
          <h1 className="font-display font-bold text-base leading-none">{title}</h1>
          {currentAcademy && (
            <p className="text-xs text-muted-foreground mt-0.5">{currentAcademy.name}</p>
          )}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <button className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border/60 text-muted-foreground hover:border-border hover:bg-surface-100 transition-all text-sm">
          <Search className="w-3.5 h-3.5" />
          <span>Buscar...</span>
          <kbd className="ml-2 text-[10px] font-mono bg-surface-200 px-1.5 py-0.5 rounded border border-border/60">⌘K</kbd>
        </button>

        {/* Notifications */}
        <button className="relative p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-100 transition-all">
          <Bell className="w-4.5 h-4.5" style={{ width: '1.125rem', height: '1.125rem' }} />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-brand-500 ring-2 ring-background" />
        </button>

        {/* New action */}
        <button className="hidden sm:flex btn-primary text-xs py-2 px-3.5 rounded-xl gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          Novo
        </button>

        {/* User avatar */}
        <div className="relative cursor-pointer group">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.full_name ?? ''}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-border/60 group-hover:ring-brand-500/40 transition-all"
            />
          ) : (
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center',
              'bg-gradient-to-br from-brand-500/30 to-cyan-500/30',
              'border border-brand-500/20 group-hover:border-brand-500/40',
              'transition-all'
            )}>
              <span className="text-xs font-bold text-brand-300">
                {getInitials(profile?.full_name ?? 'U')}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  )
}
