'use client'

// Componentes e helpers compartilhados do dashboard.
// Extraídos de `page.tsx` pra reduzir o tamanho do arquivo principal —
// webpack/HMR ficam mais rápidos porque cada save só recompila o arquivo
// mexido, não o monolito de 1700 linhas.
//
// Importante: `memo` aqui é deliberado. Esses cards são renderizados 5-15x
// por dashboard e refletem dados imutáveis (stats já calculados). Sem memo,
// qualquer setState no pai re-renderiza todos — desperdício real.

import { memo } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight, ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'

// ─────────────────────────────────────────────────────────────
// Animation variants — exportados pra page.tsx reutilizar.
// ─────────────────────────────────────────────────────────────
export const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
export const fadeUp  = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
export function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function computeStreak(timestamps: string[]) {
  if (!timestamps.length) return 0
  const daySet = new Set(timestamps.map(t => dateKey(new Date(t))))
  const cursor = new Date(); cursor.setHours(0, 0, 0, 0)
  if (!daySet.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1)
  let streak = 0
  while (daySet.has(dateKey(cursor))) { streak++; cursor.setDate(cursor.getDate() - 1) }
  return streak
}

export function formatTimeAgo(dateStr: string) {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
  if (mins < 60) return `${mins}min atrás`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h atrás`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'ontem'
  if (days < 7) return `${days}d atrás`
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
}

export function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60)
  if (mins < 60) return `${mins}min`
  const h = Math.floor(mins / 60), m = mins % 60
  return m > 0 ? `${h}h${m}min` : `${h}h`
}

// ─────────────────────────────────────────────────────────────
// UI components
// ─────────────────────────────────────────────────────────────
export const StatCard = memo(function StatCard({ label, value, delta, icon: Icon, color, suffix = '', empty = false, warning = false }: {
  label: string; value: number; delta?: string; icon: React.ComponentType<{ className?: string }>
  color: string; suffix?: string; empty?: boolean; warning?: boolean
}) {
  return (
    <motion.div variants={fadeUp} className={cn(
      'stat-card group transition-all duration-300 hover:-translate-y-0.5',
      warning ? 'hover:border-amber-500/30' : 'hover:border-brand-500/20',
    )}>
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}18`, border: `1px solid ${color}25` }}>
          <span style={{ color }}><Icon className="w-4 h-4" /></span>
        </div>
        {delta && !empty && (
          <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1',
            delta.startsWith('+') ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10')}>
            <ArrowUpRight className="w-3 h-3" />{delta}
          </span>
        )}
      </div>
      <div>
        <p className={cn('text-2xl font-display font-extrabold tracking-tight', empty && 'text-muted-foreground/40')}>
          {empty ? '—' : `${value}${suffix}`}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </motion.div>
  )
})

export const EmptyState = memo(function EmptyState({ icon: Icon, title, description, cta, ctaHref }: {
  icon: React.ComponentType<{ className?: string }>; title: string; description: string; cta: string; ctaHref: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-surface-200 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-muted-foreground/50" />
      </div>
      <p className="font-semibold text-sm">{title}</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">{description}</p>
      <Link href={ctaHref} className="btn-primary text-xs py-2 px-4 rounded-xl mt-4 inline-flex items-center gap-1.5">
        {cta} <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  )
})

export const AlertBanner = memo(function AlertBanner({ icon: Icon, color, children }: {
  icon: React.ComponentType<{ className?: string }>; color: string; children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border"
      style={{ background: `${color}08`, borderColor: `${color}20` }}>
      <span style={{ color }}><Icon className="w-4 h-4 flex-shrink-0" /></span>
      <p className="text-xs">{children}</p>
    </div>
  )
})

export const QuickAction = memo(function QuickAction({ icon: Icon, label, sublabel, href, color }: {
  icon: React.ComponentType<{ className?: string }>; label: string; sublabel?: string; href: string; color: string
}) {
  return (
    <Link href={href} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-200 transition-all group">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-105"
        style={{ background: `${color}18` }}>
        <span style={{ color }}><Icon className="w-4 h-4" /></span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {sublabel && <p className="text-[10px] text-muted-foreground">{sublabel}</p>}
      </div>
      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
    </Link>
  )
})
