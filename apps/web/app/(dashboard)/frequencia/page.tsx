'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Activity, Calendar, Dumbbell, TrendingUp, ArrowRight } from 'lucide-react'
import Link from 'next/link'

import { useAuthStore } from '@/stores/auth-store'
import { FrequencyHeatmap } from '@/components/charts/frequency-heatmap'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  }),
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function WeekGrid({ weekDays }: { weekDays: boolean[] }) {
  const today = new Date().getDay()
  return (
    <div className="grid grid-cols-7 gap-2">
      {WEEKDAYS.map((day, i) => {
        const trained = weekDays[i]
        const isToday = i === today
        return (
          <div key={day} className="flex flex-col items-center gap-2">
            <span className="text-[10px] text-muted-foreground font-medium">{day}</span>
            <div className={cn(
              'w-9 h-9 rounded-xl border-2 flex items-center justify-center transition-all',
              trained ? 'border-emerald-500/60 bg-emerald-500/15' :
              isToday ? 'border-brand-500/60 bg-brand-500/15' :
              'border-surface-300/50'
            )}>
              <div className={cn(
                'w-2 h-2 rounded-full',
                trained ? 'bg-emerald-400' :
                isToday ? 'bg-brand-400' :
                'bg-transparent border border-surface-300/30'
              )} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface FreqStats { thisWeek: number; thisMonth: number; total: number; bestStreak: number; weekDays: boolean[] }

function computeBestStreak(timestamps: string[]): number {
  if (timestamps.length === 0) return 0
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const days = [...new Set(timestamps.map(t => fmt(new Date(t))))].sort()
  let best = 1, cur = 1
  for (let i = 1; i < days.length; i++) {
    const diff = Math.round((new Date(days[i]!).getTime() - new Date(days[i - 1]!).getTime()) / 86400000)
    if (diff === 1) { cur++; if (cur > best) best = cur }
    else cur = 1
  }
  return days.length > 0 ? best : 0
}

export default function FrequenciaPage() {
  const { currentRole, currentAcademy } = useAuthStore()
  const supabase = createClient()
  const isOwnerOrPersonal = currentRole === 'owner' || currentRole === 'personal'

  const [stats, setStats] = useState<FreqStats>({ thisWeek: 0, thisMonth: 0, total: 0, bestStreak: 0, weekDays: Array(7).fill(false) })

  useEffect(() => {
    if (!currentAcademy) return
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const now = new Date()
      const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay()); weekStart.setHours(0, 0, 0, 0)
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any
      const base = isOwnerOrPersonal
        ? sb.from('workout_logs').select('created_at').eq('academy_id', currentAcademy!.id)
        : sb.from('workout_logs').select('created_at').eq('student_id', user.id).eq('academy_id', currentAcademy!.id)

      // allLogs → total + best streak | monthLogs → este mês | weekLogs → semana atual
      const [{ data: allLogs }, { data: monthLogs }, { data: weekLogs }] = await Promise.all([
        base,
        (isOwnerOrPersonal
          ? sb.from('workout_logs').select('created_at').eq('academy_id', currentAcademy!.id)
          : sb.from('workout_logs').select('created_at').eq('student_id', user.id).eq('academy_id', currentAcademy!.id)
        ).gte('created_at', monthStart.toISOString()),
        (isOwnerOrPersonal
          ? sb.from('workout_logs').select('created_at').eq('academy_id', currentAcademy!.id)
          : sb.from('workout_logs').select('created_at').eq('student_id', user.id).eq('academy_id', currentAcademy!.id)
        ).gte('created_at', weekStart.toISOString()),
      ])

      const allTimestamps = (allLogs ?? []).map((l: { created_at: string }) => l.created_at)
      const bestStreak = computeBestStreak(allTimestamps)

      const weekDays = Array(7).fill(false)
      ;(weekLogs ?? []).forEach((log: { created_at: string }) => {
        const day = new Date(log.created_at).getDay()
        weekDays[day] = true
      })

      setStats({
        thisWeek: weekLogs?.length ?? 0,
        thisMonth: monthLogs?.length ?? 0,
        total: allLogs?.length ?? 0,
        bestStreak,
        weekDays,
      })
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAcademy, currentRole])

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show">
        <h2 className="section-title">Frequência</h2>
        <p className="section-subtitle mt-1">
          {isOwnerOrPersonal ? 'Acompanhe a frequência de treinos dos seus alunos' : 'Seu histórico de presença nos treinos'}
        </p>
      </motion.div>

      {/* Stats cards */}
      <motion.div
        custom={1}
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 sm:grid-cols-4 gap-4"
      >
        {[
          { label: 'Esta semana', value: String(stats.thisWeek), icon: Calendar, color: '#6366F1' },
          { label: 'Este mês', value: String(stats.thisMonth), icon: Activity, color: '#10B981' },
          { label: 'Melhor sequência', value: stats.bestStreak > 0 ? `${stats.bestStreak}d` : '—', icon: TrendingUp, color: '#F97316' },
          { label: 'Total de treinos', value: String(stats.total), icon: Dumbbell, color: '#06B6D4' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center mb-2"
              style={{ background: `${color}18`, border: `1px solid ${color}25` }}
            >
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <p className={cn('text-xl font-display font-extrabold', value === '0' || value === '—' ? 'text-muted-foreground/40' : '')}>{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </motion.div>

      {/* Current week */}
      <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show" className="glass rounded-2xl p-5">
        <h3 className="font-display font-bold text-sm mb-4">Semana atual</h3>
        <WeekGrid weekDays={stats.weekDays} />
        <p className="text-xs text-muted-foreground mt-4 text-center">
          {stats.thisWeek === 0 ? 'Nenhum treino registrado nesta semana ainda.' : `${stats.thisWeek} treino${stats.thisWeek > 1 ? 's' : ''} nesta semana`}
        </p>
      </motion.div>

      {/* Heatmap */}
      <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show" className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-bold text-sm">Mapa do último ano</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Cada quadrado = 1 dia</p>
          </div>
          <TrendingUp className="w-4 h-4 text-brand-400" />
        </div>
        <FrequencyHeatmap />
        <div className="flex items-center justify-between mt-3 text-[10px] text-muted-foreground">
          <span>Menos</span>
          <div className="flex gap-1">
            {['bg-surface-200', 'bg-brand-900', 'bg-brand-700', 'bg-brand-500', 'bg-brand-400'].map((c) => (
              <div key={c} className={cn('w-2.5 h-2.5 rounded-sm', c)} />
            ))}
          </div>
          <span>Mais</span>
        </div>
      </motion.div>

      {/* Empty state CTA */}
      <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show" className="glass rounded-2xl p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-surface-200 flex items-center justify-center mx-auto mb-4">
          <Dumbbell className="w-7 h-7 text-muted-foreground/40" />
        </div>
        <p className="font-semibold text-sm">
          {isOwnerOrPersonal ? 'Nenhum treino registrado ainda' : 'Você ainda não registrou nenhum treino'}
        </p>
        <p className="text-xs text-muted-foreground mt-1.5 max-w-[280px] mx-auto">
          {isOwnerOrPersonal
            ? 'Os treinos dos seus alunos aparecerão aqui conforme forem executados.'
            : 'Execute seu primeiro treino para começar a construir seu histórico.'}
        </p>
        <Link
          href={isOwnerOrPersonal ? '/treinos/novo' : '/treinos'}
          className="btn-primary text-sm py-2.5 px-5 rounded-xl mt-4 inline-flex items-center gap-1.5"
        >
          {isOwnerOrPersonal ? 'Criar ficha de treino' : 'Ver meus treinos'}
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </motion.div>
    </div>
  )
}
