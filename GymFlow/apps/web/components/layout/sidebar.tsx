'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dumbbell, LayoutDashboard, Users, ClipboardList, BookOpen,
  Settings, ChevronLeft, ChevronRight, LogOut, ChevronsUpDown,
  Activity, CalendarDays, History, TrendingUp, ShieldCheck, UserCircle, Video,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import { useUIStore } from '@/stores/ui-store'
import { useAuth } from '@/hooks/use-auth'
import { getInitials } from '@/lib/utils'
import type { NavItem } from '@/types'

const NAV_ITEMS: NavItem[] = [
  // Todos
  { label: 'Dashboard',     href: '/dashboard',    icon: LayoutDashboard, roles: ['owner', 'personal', 'student'] },
  // Owner
  { label: 'Personais',     href: '/personais',    icon: ShieldCheck,     roles: ['owner'] },
  { label: 'Alunos',        href: '/alunos',       icon: Users,           roles: ['owner'] },
  { label: 'Treinos',       href: '/treinos',      icon: ClipboardList,   roles: ['owner'] },
  { label: 'Exercícios',    href: '/exercicios',   icon: BookOpen,        roles: ['owner'] },
  { label: 'Frequência',    href: '/frequencia',   icon: Activity,        roles: ['owner'] },
  // Personal
  { label: 'Meus alunos',   href: '/alunos',       icon: Users,           roles: ['personal'] },
  { label: 'Fichas',        href: '/treinos',      icon: ClipboardList,   roles: ['personal'] },
  { label: 'Exercícios',    href: '/exercicios',   icon: BookOpen,        roles: ['personal'] },
  { label: 'Frequência',    href: '/frequencia',   icon: Activity,        roles: ['personal'] },
  // Student
  { label: 'Meus treinos',  href: '/treinos',      icon: Dumbbell,        roles: ['student'] },
  { label: 'Agenda',        href: '/agenda',       icon: CalendarDays,    roles: ['student'] },
  { label: 'Histórico',     href: '/historico',    icon: History,         roles: ['student'] },
  { label: 'Evolução',      href: '/evolucao',     icon: TrendingUp,      roles: ['student'] },
  { label: 'Frequência',    href: '/frequencia',   icon: Activity,        roles: ['student'] },
  { label: 'Vídeos',        href: '/videos',       icon: Video,           roles: ['student'] },
  // Todos
  { label: 'Perfil',        href: '/perfil',       icon: UserCircle,      roles: ['owner', 'personal', 'student'] },
  { label: 'Configurações', href: '/configuracoes',icon: Settings,        roles: ['owner', 'personal', 'student'] },
]

function AcademySwitcher() {
  const { currentAcademy, currentRole, academies, setCurrentAcademy } = useAuthStore()
  const { collapsed } = { collapsed: useUIStore((s) => s.sidebarCollapsed) }

  if (!currentAcademy) return null

  return (
    <div className={cn(
      'relative flex items-center gap-3 p-2.5 rounded-xl cursor-pointer',
      'hover:bg-surface-200 transition-all duration-200 group border border-transparent',
      'hover:border-border/40'
    )}>
      {/* Academy avatar */}
      <div className="relative flex-shrink-0 w-8 h-8 rounded-lg overflow-hidden">
        {currentAcademy.logo_url ? (
          <img src={currentAcademy.logo_url} alt={currentAcademy.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
            <span className="text-white font-bold text-xs">{getInitials(currentAcademy.name)}</span>
          </div>
        )}
        <div className="absolute inset-0 rounded-lg ring-1 ring-white/10" />
      </div>

      {!collapsed && (
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate leading-tight">{currentAcademy.name}</p>
          <p className="text-[11px] text-muted-foreground capitalize">{currentRole}</p>
        </div>
      )}

      {!collapsed && <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-muted-foreground transition-colors flex-shrink-0" />}
    </div>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const { signOut, profile } = useAuth()
  const { currentRole } = useAuthStore()
  const { sidebarCollapsed, setSidebarCollapsed, sidebarOpen, setSidebarOpen } = useUIStore()

  const filteredNav = NAV_ITEMS.filter(
    (item) => !item.roles || (currentRole && item.roles.includes(currentRole))
  )

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 68 : 240 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          'fixed top-0 left-0 h-full z-40 flex flex-col',
          'bg-surface-50 border-r border-border/50',
          'transform transition-transform lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo area */}
        <div className={cn(
          'flex items-center h-16 px-4 border-b border-border/40 flex-shrink-0',
          sidebarCollapsed ? 'justify-center' : 'justify-between'
        )}>
          <AnimatePresence mode="wait">
            {sidebarCollapsed ? (
              <motion.div
                key="icon"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative flex items-center justify-center w-8 h-8"
              >
                <div className="absolute inset-0 rounded-lg bg-brand-500 blur-sm opacity-50" />
                <div className="relative rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 p-1.5">
                  <Dumbbell className="w-4 h-4 text-white" />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <div className="relative flex items-center justify-center w-7 h-7">
                  <div className="absolute inset-0 rounded-lg bg-brand-500 blur-sm opacity-50" />
                  <div className="relative rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 p-1.5">
                    <Dumbbell className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
                <span className="font-display font-bold text-base">
                  Gym<span className="text-brand-400">Flow</span>
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {!sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(true)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-200 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Academy switcher */}
        <div className={cn('px-3 pt-4 pb-2', sidebarCollapsed && 'px-2')}>
          <AcademySwitcher />
        </div>

        {/* Divider */}
        <div className="mx-3 border-t border-border/40 mb-3" />

        {/* Navigation */}
        <nav className={cn('flex-1 overflow-y-auto px-3 space-y-0.5 pb-4', sidebarCollapsed && 'px-2')}>
          {filteredNav.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'nav-item relative overflow-hidden',
                  active && 'active',
                  sidebarCollapsed && 'justify-center px-0'
                )}
                title={sidebarCollapsed ? item.label : undefined}
              >
                {active && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 rounded-xl bg-surface-200 border border-brand-500/20"
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  />
                )}
                <item.icon className={cn(
                  'relative z-10 w-4.5 h-4.5 flex-shrink-0',
                  active ? 'text-brand-400' : 'text-muted-foreground'
                )} />
                {!sidebarCollapsed && (
                  <span className="relative z-10">{item.label}</span>
                )}
                {item.badge && !sidebarCollapsed && (
                  <span className="relative z-10 ml-auto badge-primary text-xs">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Expand button (collapsed state) */}
        {sidebarCollapsed && (
          <div className="px-2 pb-3">
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="w-full flex items-center justify-center p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-200 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* User footer */}
        <div className={cn(
          'border-t border-border/40 p-3 flex items-center gap-3',
          sidebarCollapsed && 'justify-center px-2'
        )}>
          <div className="relative flex-shrink-0">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name ?? ''}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500/40 to-cyan-500/40 flex items-center justify-center border border-brand-500/20">
                <span className="text-xs font-bold text-brand-300">
                  {getInitials(profile?.full_name ?? 'U')}
                </span>
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-surface-50" />
          </div>

          {!sidebarCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate leading-tight">
                  {profile?.full_name ?? 'Usuário'}
                </p>
              </div>
              <button
                onClick={signOut}
className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-all"
                title="Sair"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </motion.aside>
    </>
  )
}
