'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  History, Dumbbell, Clock, ChevronDown, ChevronUp,
  Calendar, Trophy, TrendingUp, Zap,
} from 'lucide-react'
import { toast } from 'sonner'

import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { cn, formatDuration } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  }),
}

const GOAL_COLORS: Record<string, string> = {
  'Hipertrofia': '#6366F1',
  'Força': '#10B981',
  'Condicionamento': '#06B6D4',
  'Perda de peso': '#F97316',
  'Reabilitação': '#F59E0B',
  'Flexibilidade': '#EC4899',
}

interface SetLogDetail {
  exercise_name: string
  set_number: number
  reps_done: number
  weight_kg: number | null
}

interface WorkoutSession {
  id: string
  created_at: string
  completed_at: string | null
  duration_seconds: number | null
  sheet_name: string
  sheet_goal: string | null
  sets_completed: number
  total_volume: number
  sets: SetLogDetail[]
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
}

function formatRelative(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`
  if (diff < 172800) return 'Ontem'
  return formatDate(iso)
}

function SessionCard({ session, index }: { session: WorkoutSession; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const color = GOAL_COLORS[session.sheet_goal ?? ''] ?? '#6366F1'

  const exerciseSummary = session.sets.reduce<Record<string, { name: string; bestWeight: number | null; totalSets: number }>>((acc, s) => {
    if (!acc[s.exercise_name]) {
      acc[s.exercise_name] = { name: s.exercise_name, bestWeight: s.weight_kg, totalSets: 0 }
    }
    const entry = acc[s.exercise_name]!
    entry.totalSets++
    if (s.weight_kg && (!entry.bestWeight || s.weight_kg > entry.bestWeight)) {
      entry.bestWeight = s.weight_kg
    }
    return acc
  }, {})

  const exercises = Object.values(exerciseSummary)

  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className="glass rounded-2xl overflow-hidden"
    >
      {/* Color bar */}
      <div className="h-1" style={{ background: `linear-gradient(90deg, ${color}, ${color}44)` }} />

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              {session.sheet_goal && (
                <span className="badge text-[10px]"
                  style={{ background: `${color}15`, color, borderColor: `${color}30` }}>
                  {session.sheet_goal}
                </span>
              )}
            </div>
            <p className="font-display font-bold text-sm leading-snug">{session.sheet_name}</p>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatRelative(session.created_at)}
            </p>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-200 transition-all flex-shrink-0"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          {[
            { icon: Clock, label: 'Duração', value: session.duration_seconds ? formatDuration(session.duration_seconds) : '—' },
            { icon: Dumbbell, label: 'Séries', value: String(session.sets_completed) },
            { icon: TrendingUp, label: 'Volume', value: session.total_volume >= 1000 ? `${(session.total_volume / 1000).toFixed(1)}t` : `${session.total_volume}kg` },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-2 p-2 rounded-xl bg-surface-100">
              <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-bold text-xs truncate">{value}</p>
                <p className="text-[10px] text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Expanded detail */}
        <AnimatePresence>
          {expanded && exercises.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t border-border/40 space-y-1.5">
                {exercises.map((ex) => (
                  <div key={ex.name} className="flex items-center justify-between text-xs py-1.5 px-3 rounded-lg bg-surface-100">
                    <span className="font-medium truncate flex-1">{ex.name}</span>
                    <div className="flex items-center gap-3 text-muted-foreground ml-2">
                      <span>{ex.totalSets} séries</span>
                      {ex.bestWeight && (
                        <span className="text-brand-400 font-bold">{ex.bestWeight}kg</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default function HistoricoPage() {
  const { currentAcademy, profile } = useAuthStore()
  const supabase = createClient()

  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const PAGE_SIZE = 10

  const load = useCallback(async (pageNum: number) => {
    if (!currentAcademy || !profile) { setLoading(false); return }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('workout_logs')
      .select(`
        id, created_at, completed_at, duration_seconds,
        workout_sheets ( name, goal ),
        set_logs (
          set_number, reps_done, weight_kg,
          exercises ( name_pt )
        )
      `)
      .eq('academy_id', currentAcademy.id)
      .eq('student_id', profile.id)
      .not('completed_at', 'is', null)
      .order('created_at', { ascending: false })
      .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE)

    if (error) { toast.error('Erro ao carregar histórico.'); setLoading(false); return }

    const mapped: WorkoutSession[] = (data ?? []).map((row: any) => {
      const sets: SetLogDetail[] = (row.set_logs ?? []).map((s: any) => ({
        exercise_name: s.exercises?.name_pt ?? 'Exercício',
        set_number: s.set_number,
        reps_done: s.reps_done,
        weight_kg: s.weight_kg,
      }))

      const volume = sets.reduce((acc, s) => acc + (s.weight_kg ?? 0) * s.reps_done, 0)

      return {
        id: row.id,
        created_at: row.created_at,
        completed_at: row.completed_at,
        duration_seconds: row.duration_seconds,
        sheet_name: row.workout_sheets?.name ?? 'Treino',
        sheet_goal: row.workout_sheets?.goal ?? null,
        sets_completed: sets.length,
        total_volume: Math.round(volume),
        sets,
      }
    })

    if (pageNum === 0) setSessions(mapped)
    else setSessions((prev) => [...prev, ...mapped])

    setHasMore(mapped.length === PAGE_SIZE + 1)
    setLoading(false)
  }, [currentAcademy, profile])

  useEffect(() => { void load(0) }, [load])

  // Summary stats
  const totalVolume = sessions.reduce((acc, s) => acc + s.total_volume, 0)
  const avgDuration = sessions.length > 0
    ? Math.round(sessions.reduce((acc, s) => acc + (s.duration_seconds ?? 0), 0) / sessions.length)
    : 0

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show"
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="section-title">Histórico de treinos</h2>
          <p className="section-subtitle mt-1">
            {loading ? 'Carregando...' : `${sessions.length} treinos registrados`}
          </p>
        </div>
      </motion.div>

      {/* Summary cards */}
      {!loading && sessions.length > 0 && (
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show"
          className="grid grid-cols-3 gap-3"
        >
          {[
            { icon: Trophy, label: 'Total', value: String(sessions.length), sub: 'treinos' },
            { icon: TrendingUp, label: 'Volume total', value: totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(0)}t` : `${totalVolume}kg`, sub: 'levantado' },
            { icon: Zap, label: 'Duração média', value: formatDuration(avgDuration), sub: 'por treino' },
          ].map(({ icon: Icon, label, value, sub }) => (
            <div key={label} className="glass rounded-2xl p-4 text-center">
              <Icon className="w-4 h-4 text-brand-400 mx-auto mb-2" />
              <p className="font-display font-bold text-lg leading-none">{value}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl overflow-hidden">
              <Skeleton className="h-1 rounded-none" />
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-3.5 w-16" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-xl flex-shrink-0" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Skeleton className="h-12 rounded-xl" />
                  <Skeleton className="h-12 rounded-xl" />
                  <Skeleton className="h-12 rounded-xl" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && sessions.length === 0 && (
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show"
          className="text-center py-20"
        >
          <div className="w-14 h-14 rounded-2xl bg-surface-200 flex items-center justify-center mx-auto mb-4">
            <History className="w-7 h-7 text-muted-foreground/40" />
          </div>
          <p className="font-semibold text-muted-foreground">Nenhum treino realizado ainda</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Complete seu primeiro treino para ver o histórico aqui.
          </p>
        </motion.div>
      )}

      {/* Session list */}
      {!loading && sessions.length > 0 && (
        <div className="space-y-3">
          {sessions.map((session, i) => (
            <SessionCard key={session.id} session={session} index={i + 2} />
          ))}

          {hasMore && (
            <button
              onClick={() => { const next = page + 1; setPage(next); void load(next) }}
              className="w-full py-3 rounded-xl border border-border/60 text-sm text-muted-foreground hover:text-foreground hover:bg-surface-100 transition-all"
            >
              Carregar mais
            </button>
          )}
        </div>
      )}
    </div>
  )
}
