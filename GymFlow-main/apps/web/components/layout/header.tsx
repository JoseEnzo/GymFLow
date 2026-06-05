'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, Bell, Search, Plus, ArrowLeft, User, LogOut } from 'lucide-react'
import Link from 'next/link'

import { useUIStore } from '@/stores/ui-store'
import { useAuthStore } from '@/stores/auth-store'
import { useAuth } from '@/hooks/use-auth'
import { getInitials } from '@/lib/utils'
import { cn } from '@/lib/utils'

const ROOT_ROUTES = new Set(['/dashboard'])

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/alunos': 'Alunos',
  '/treinos': 'Treinos',
  '/treinos/novo': 'Nova ficha',
  '/exercicios': 'Exercícios',
  '/frequencia': 'Frequência',
  '/configuracoes': 'Configurações',
  '/historico': 'Histórico',
  '/evolucao': 'Evolução',
  '/perfil': 'Perfil',
  '/agenda': 'Agenda',
  '/personais': 'Personais',
  '/relatorios': 'Relatórios',
}

function getPageInfo(pathname: string): { title: string; isSubPage: boolean } {
  const isSubPage = !ROOT_ROUTES.has(pathname)

  const exact = PAGE_TITLES[pathname]
  if (exact) return { title: exact, isSubPage }

  if (pathname.startsWith('/treinos/executar/')) return { title: 'Executar treino', isSubPage: true }
  if (pathname.startsWith('/treinos/')) return { title: 'Ficha de treino', isSubPage: true }
  if (pathname.startsWith('/alunos/')) return { title: 'Aluno', isSubPage: true }
  if (pathname.startsWith('/exercicios/')) return { title: 'Exercício', isSubPage: true }

  return { title: 'MeuTrein', isSubPage }
}

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { setSidebarOpen } = useUIStore()
  const { profile, signOut } = useAuth()
  const { currentAcademy } = useAuthStore()
  const { title, isSubPage } = getPageInfo(pathname)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 sm:px-6 border-b border-border/40 bg-background/80 backdrop-blur-xl"
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        {isSubPage ? (
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-100 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-100 transition-all"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

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

        {/* User avatar + dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="relative cursor-pointer group focus:outline-none"
          >
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
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="absolute right-0 top-11 w-52 rounded-2xl border border-border/60 bg-card shadow-xl overflow-hidden z-50"
              >
                {/* User info */}
                <div className="px-4 py-3 border-b border-border/40">
                  <p className="text-sm font-semibold truncate">{profile?.full_name ?? 'Usuário'}</p>
                </div>

                {/* Actions */}
                <div className="p-1.5 space-y-0.5">
                  <Link
                    href="/perfil"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-surface-100 transition-all"
                  >
                    <User className="w-4 h-4" />
                    Meu perfil
                  </Link>

                  <button
                    onClick={() => { setMenuOpen(false); signOut() }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    Sair
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
  )
}
