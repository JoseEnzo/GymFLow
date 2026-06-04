'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ClipboardList, CalendarDays,
  History, TrendingUp, Users, BookOpen, Activity, UserCog, BarChart2,
} from 'lucide-react'
import { motion } from 'framer-motion'

import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

const STUDENT_ITEMS = [
  { label: 'Início',    href: '/dashboard', icon: LayoutDashboard },
  { label: 'Treinos',   href: '/treinos',   icon: ClipboardList   },
  { label: 'Agenda',    href: '/agenda',    icon: CalendarDays    },
  { label: 'Histórico', href: '/historico', icon: History         },
  { label: 'Evolução',  href: '/evolucao',  icon: TrendingUp      },
]

// Owner: foco em administração
const OWNER_ITEMS = [
  { label: 'Início',     href: '/dashboard',  icon: LayoutDashboard },
  { label: 'Alunos',     href: '/alunos',     icon: Users           },
  { label: 'Fichas',     href: '/treinos',    icon: ClipboardList   },
  { label: 'Exercícios', href: '/exercicios', icon: BookOpen        },
  { label: 'Frequência', href: '/frequencia', icon: BarChart2       },
]

// Personal: foco em treino
const PERSONAL_ITEMS = [
  { label: 'Início',     href: '/dashboard',  icon: LayoutDashboard },
  { label: 'Alunos',     href: '/alunos',     icon: Users           },
  { label: 'Fichas',     href: '/treinos',    icon: ClipboardList   },
  { label: 'Exercícios', href: '/exercicios', icon: BookOpen        },
  { label: 'Frequência', href: '/frequencia', icon: Activity        },
]

export function BottomNav() {
  const pathname = usePathname()
  const { currentRole } = useAuthStore()

  if (!currentRole) return null

  const items =
    currentRole === 'student' ? STUDENT_ITEMS :
    currentRole === 'owner'   ? OWNER_ITEMS   : PERSONAL_ITEMS

  function isActive(href: string) {
    return pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
  }

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-surface-50/90 backdrop-blur-xl border-t border-border/50">
      {/* safe-area para iphones com home indicator */}
      <div className="flex items-center justify-around px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {items.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-colors group"
            >
              {active && (
                <motion.div
                  layoutId="bottomNavActive"
                  className="absolute inset-0 rounded-xl bg-brand-500/10"
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                />
              )}
              <item.icon
                className={cn(
                  'relative z-10 w-5 h-5 transition-colors',
                  active ? 'text-brand-400' : 'text-muted-foreground group-hover:text-foreground',
                )}
              />
              <span
                className={cn(
                  'relative z-10 text-[10px] font-medium leading-none transition-colors',
                  active ? 'text-brand-400' : 'text-muted-foreground group-hover:text-foreground',
                )}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
