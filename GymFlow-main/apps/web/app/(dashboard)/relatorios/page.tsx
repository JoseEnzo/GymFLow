'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3, TrendingUp, TrendingDown, Users, Dumbbell,
  Calendar, Flame, ClipboardList, Activity, Minus,
} from 'lucide-react'

import { useAuthStore } from '@/stores/auth-store'
import { FrequencyHeatmap } from '@/components/charts/frequency-heatmap'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  }),
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

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

interface Stats {
  totalWorkouts: number
  prevWeekWorkouts: number
  thisMonth: number
  totalAllTime: number
  bestStreak: number
  activeStudents: number
  totalActiveMembers: number
  newSheets: number
  workoutsByDay: number[]
  topStudents: { name: string | null; count: number }[]
}

function DeltaBadge({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return null
  if (previous === 0) return (
    <span className="flex items-center gap-0.5 text-[10px] font-semibold text-emerald-400">
      <TrendingUp className="w-3 h-3" /> novo
    </span>
  )
  const pct = Math.round(((current - previous) / previous) * 100)
  if (pct === 0) return (
    <span className="flex items-center gap-0.5 text-[10px] font-semibold text-muted-foreground">
      <Minus className="w-3 h-3" /> 0%
    </span>
  )
  return pct > 0 ? (
    <span className="flex items-center gap-0.5 text-[10px] font-semibold text-emerald-400">
      <TrendingUp className="w-3 h-3" /> +{pct}%
    </span>
  ) : (
    <span className="flex items-center gap-0.5 text-[10px] font-semibold text-red-400">
      <TrendingDown className="w-3 h-3" /> {pct}%
    </span>
  )
}

export default function RelatoriosPage() {
  const { currentAcademy } = useAuthStore()
  const supabase = createClient()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentAcademy) { setLoading(false); return }
    async function load() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any
      const now = new Date()

      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - now.getDay())
      weekStart.setHours(0, 0, 0, 0)

      const prevWeekStart = new Date(weekStart)
      prevWeekStart.setDate(prevWeekStart.getDate() - 7)
      const prevWeekEnd = new Date(weekStart)
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

      const base = sb.from('workout_logs').select('created_at, student_id').eq('academy_id', currentAcademy!.id)

      const [
        { data: allLogs },
        { data: weekLogs },
        { data: prevWeekLogs },
        { data: monthLogs },
        { data: activeMembers },
        { data: newSheets },
      ] = await Promise.all([
        sb.from('workout_logs').select('created_at, student_id').eq('academy_id', currentAcademy!.id),
        base.gte('created_at', weekStart.toISOString()),
        sb.from('workout_logs').select('created_at').eq('academy_id', currentAcademy!.id)
          .gte('created_at', prevWeekStart.toISOString())
          .lt('created_at', prevWeekEnd.toISOString()),
        sb.from('workout_logs').select('created_at').eq('academy_id', currentAcademy!.id)
          .gte('created_at', monthStart.toISOString()),
        sb.from('academy_members').select('user_id')
          .eq('academy_id', currentAcademy!.id).eq('role', 'student').eq('is_active', true),
        sb.from('workout_sheets').select('id')
          .eq('academy_id', currentAcademy!.id).gte('created_at', monthStart.toISOString()),
      ])

      const workoutsByDay = Array(7).fill(0)
      const studentWorkoutCount: Record<string, number> = {}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(weekLogs ?? []).forEach((log: any) => {
        workoutsByDay[new Date(log.created_at).getDay()]++
        studentWorkoutCount[log.student_id] = (studentWorkoutCount[log.student_id] ?? 0) + 1
      })

      const topIds = Object.entries(studentWorkoutCount)
        .sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id]) => id)

      const { data: topProfiles } = topIds.length > 0
        ? await sb.from('profiles').select('id, full_name').in('id', topIds)
        : { data: [] }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nameMap: Record<string, string | null> = {}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(topProfiles ?? []).forEach((p: any) => { nameMap[p.id] = p.full_name })

      const allTimestamps = (allLogs ?? []).map((l: { created_at: string }) => l.created_at)

      setStats({
        totalWorkouts: weekLogs?.length ?? 0,
        prevWeekWorkouts: prevWeekLogs?.length ?? 0,
        thisMonth: monthLogs?.length ?? 0,
        totalAllTime: allLogs?.length ?? 0,
        bestStreak: computeBestStreak(allTimestamps),
        activeStudents: new Set(Object.keys(studentWorkoutCount)).size,
        totalActiveMembers: activeMembers?.length ?? 0,
        newSheets: newSheets?.length ?? 0,
        workoutsByDay,
        topStudents: topIds.map((id) => ({ name: nameMap[id] ?? null, count: studentWorkoutCount[id]! })),
      })
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAcademy])

  const engagementPct = stats && stats.totalActiveMembers > 0
    ? Math.round((stats.activeStudents / stats.totalActiveMembers) * 100)
    : 0
  const maxDay = stats ? Math.max(...stats.workoutsByDay, 1) : 1

  return (
    <div className="space-y-6">
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show">
        <h2 className="section-title">Relatórios</h2>
        <p className="section-subtitle mt-1">Frequência e engajamento da sua academia</p>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="stat-card animate-pulse">
              <div className="w-9 h-9 rounded-xl bg-surface-200 mb-2" />
              <div className="h-6 w-12 bg-surface-200 rounded mb-1" />
              <div className="h-3 w-20 bg-surface-200 rounded" />
            </div>
          ))}
        </div>
      ) : stats ? (
        <>
          {/* Stat cards — linha 1: semana */}
          <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show"
            className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                label: 'Treinos esta semana',
                value: stats.totalWorkouts,
                icon: Dumbbell,
                color: '#6366F1',
                delta: <DeltaBadge current={stats.totalWorkouts} previous={stats.prevWeekWorkouts} />,
              },
              {
                label: 'Alunos que treinaram',
                value: stats.activeStudents,
                icon: Users,
                color: '#10B981',
                delta: null,
              },
              {
                label: 'Taxa de engajamento',
                value: `${engagementPct}%`,
                icon: Flame,
                color: '#F97316',
                delta: null,
              },
              {
                label: 'Fichas criadas (mês)',
                value: stats.newSheets,
                icon: ClipboardList,
                color: '#06B6D4',
                delta: null,
              },
            ].map(({ label, value, icon: Icon, color, delta }) => (
              <div key={label} className="stat-card">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2"
                  style={{ background: `${color}18`, border: `1px solid ${color}25` }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <div className="flex items-end gap-1.5">
                  <p className={cn(
                    'text-xl font-display font-extrabold',
                    (value === 0 || value === '0%') ? 'text-muted-foreground/40' : ''
                  )}>{value}</p>
                  {delta}
                </div>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </motion.div>

          {/* Stat cards — linha 2: histórico */}
          <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show"
            className="grid grid-cols-3 gap-4">
            {[
              { label: 'Este mês', value: String(stats.thisMonth), icon: Calendar, color: '#6366F1' },
              { label: 'Total de treinos', value: String(stats.totalAllTime), icon: Dumbbell, color: '#10B981' },
              { label: 'Melhor sequência', value: stats.bestStreak > 0 ? `${stats.bestStreak}d` : '—', icon: TrendingUp, color: '#F97316' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="stat-card">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2"
                  style={{ background: `${color}18`, border: `1px solid ${color}25` }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <p className={cn('text-xl font-display font-extrabold', (value === '0' || value === '—') ? 'text-muted-foreground/40' : '')}>{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </motion.div>

          {/* Treinos por dia da semana */}
          <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show"
            className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-5">
              <Calendar className="w-4 h-4 text-brand-400" />
              <h3 className="font-display font-bold text-sm">Treinos por dia da semana</h3>
            </div>
            <div className="flex items-end gap-2 h-28">
              {WEEKDAYS.map((day, i) => {
                const count = stats.workoutsByDay[i] ?? 0
                const pct = (count / maxDay) * 100
                const isToday = i === new Date().getDay()
                return (
                  <div key={day} className="flex-1 flex flex-col items-center gap-1.5">
                    <span className="text-[10px] font-bold text-foreground/70">{count > 0 ? count : ''}</span>
                    <div className="w-full rounded-t-lg transition-all duration-500"
                      style={{
                        height: `${Math.max(pct, 4)}%`,
                        background: isToday ? '#1D9E75' : count > 0 ? '#1D9E7566' : '#ffffff10',
                        minHeight: 4,
                      }} />
                    <span className={cn('text-[10px]', isToday ? 'text-brand-300 font-semibold' : 'text-muted-foreground')}>
                      {day}
                    </span>
                  </div>
                )
              })}
            </div>
          </motion.div>

          {/* Engajamento */}
          <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show"
            className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-brand-400" />
              <h3 className="font-display font-bold text-sm">Engajamento semanal</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 flex-shrink-0">
                <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#ffffff10" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.9" fill="none"
                    stroke="#1D9E75" strokeWidth="3"
                    strokeDasharray={`${engagementPct} 100`}
                    strokeLinecap="round"
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-display font-extrabold text-sm">{engagementPct}%</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-semibold">
                  {stats.activeStudents} de {stats.totalActiveMembers} alunos treinaram
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats.totalActiveMembers - stats.activeStudents > 0
                    ? `${stats.totalActiveMembers - stats.activeStudents} aluno${stats.totalActiveMembers - stats.activeStudents > 1 ? 's' : ''} sem treino esta semana`
                    : 'Todos os alunos treinaram esta semana!'}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Top alunos */}
          {stats.topStudents.length > 0 && (
            <motion.div custom={5} variants={fadeUp} initial="hidden" animate="show"
              className="glass rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-brand-400" />
                <h3 className="font-display font-bold text-sm">Alunos mais ativos esta semana</h3>
              </div>
              <div className="space-y-3">
                {stats.topStudents.map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-[11px] font-bold text-muted-foreground w-4 text-right">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{s.name ?? 'Aluno'}</span>
                        <span className="text-xs font-bold text-brand-300">{s.count} treino{s.count > 1 ? 's' : ''}</span>
                      </div>
                      <div className="h-1.5 bg-surface-200 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500 rounded-full transition-all duration-700"
                          style={{ width: `${(s.count / stats.topStudents[0]!.count) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Heatmap do último ano */}
          <motion.div custom={6} variants={fadeUp} initial="hidden" animate="show"
            className="glass rounded-2xl p-5">
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

          {stats.totalWorkouts === 0 && stats.totalAllTime === 0 && (
            <motion.div custom={7} variants={fadeUp} initial="hidden" animate="show"
              className="glass rounded-2xl p-8 text-center">
              <Dumbbell className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="font-semibold text-sm text-muted-foreground">Nenhum treino registrado ainda</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Os dados aparecerão conforme os alunos executarem treinos.
              </p>
            </motion.div>
          )}
        </>
      ) : null}
    </div>
  )
}
