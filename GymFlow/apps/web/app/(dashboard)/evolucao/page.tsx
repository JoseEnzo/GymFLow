'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, Dumbbell, ChevronDown, Loader2, BarChart3, Ruler, Activity } from 'lucide-react'
import { BodyEvolutionSection } from '@/components/evolution/body-evolution-section'
import { toast } from 'sonner'

import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  }),
}

interface WeekPoint {
  week: string
  treinos: number
  volume: number
}

interface ExercisePoint {
  date: string
  maxWeight: number
  totalVolume: number
  session: number
}

interface ExerciseOption {
  id: string
  name: string
}

function CustomTooltip({ active, payload, label, volumeMode }: {
  active?: boolean
  payload?: Array<{ dataKey: string; value: number; color: string }>
  label?: string
  volumeMode?: boolean
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl p-3 border border-border/60 shadow-xl text-xs">
      <p className="font-semibold mb-2 text-foreground">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-muted-foreground">
            {entry.dataKey === 'treinos' ? 'Treinos' : entry.dataKey === 'volume' ? 'Volume' : entry.dataKey === 'maxWeight' ? 'Carga máx.' : 'Volume'}:
          </span>
          <span className="font-bold" style={{ color: entry.color }}>
            {entry.dataKey === 'treinos' ? entry.value :
              entry.dataKey === 'volume' || entry.dataKey === 'totalVolume'
                ? entry.value >= 1000 ? `${(entry.value / 1000).toFixed(1)}t` : `${entry.value}kg`
                : `${entry.value}kg`}
          </span>
        </div>
      ))}
    </div>
  )
}

function getWeekLabel(date: Date): string {
  const d = new Date(date)
  d.setDate(d.getDate() - d.getDay()) // week start (Sun)
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
}

export default function EvolucaoPage() {
  const { currentAcademy, profile } = useAuthStore()
  const supabase = createClient()

  const [activeTab, setActiveTab] = useState<'treinos' | 'corpo'>('treinos')
  const [weeklyData, setWeeklyData] = useState<WeekPoint[]>([])
  const [exercises, setExercises] = useState<ExerciseOption[]>([])
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null)
  const [exerciseData, setExerciseData] = useState<ExercisePoint[]>([])
  const [loadingWeekly, setLoadingWeekly] = useState(true)
  const [loadingExercise, setLoadingExercise] = useState(false)
  const [showExercisePicker, setShowExercisePicker] = useState(false)

  const loadWeekly = useCallback(async () => {
    if (!currentAcademy || !profile) { setLoadingWeekly(false); return }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('workout_logs')
      .select(`
        id, created_at,
        set_logs ( reps_done, weight_kg )
      `)
      .eq('academy_id', currentAcademy.id)
      .eq('student_id', profile.id)
      .not('completed_at', 'is', null)
      .gte('created_at', new Date(Date.now() - 56 * 86400000).toISOString()) // 8 weeks
      .order('created_at', { ascending: true })

    if (error) { toast.error('Erro ao carregar evolução.'); setLoadingWeekly(false); return }

    // Group by week
    const byWeek: Record<string, { treinos: number; volume: number }> = {}
    for (const row of (data ?? [])) {
      const label = getWeekLabel(new Date(row.created_at))
      if (!byWeek[label]) byWeek[label] = { treinos: 0, volume: 0 }
      byWeek[label].treinos++
      for (const s of (row.set_logs ?? [])) {
        byWeek[label].volume += (s.weight_kg ?? 0) * (s.reps_done ?? 0)
      }
    }

    setWeeklyData(
      Object.entries(byWeek).map(([week, v]) => ({
        week,
        treinos: v.treinos,
        volume: Math.round(v.volume),
      }))
    )

    // Load exercises that this student has done
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: exData } = await (supabase as any)
      .from('set_logs')
      .select('exercises ( id, name_pt )')
      .eq('workout_logs.student_id', profile.id)
      .not('weight_kg', 'is', null)
      .gt('weight_kg', 0)
      .limit(100)

    // De-duplicate exercises from set_logs via workout_logs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: exData2 } = await (supabase as any)
      .from('set_logs')
      .select(`
        exercise_id,
        exercises ( id, name_pt ),
        workout_logs!inner ( student_id, academy_id )
      `)
      .eq('workout_logs.student_id', profile.id)
      .eq('workout_logs.academy_id', currentAcademy.id)
      .not('weight_kg', 'is', null)
      .gt('weight_kg', 0)

    const seen = new Set<string>()
    const exOptions: ExerciseOption[] = []
    for (const row of (exData2 ?? [])) {
      const ex = row.exercises
      if (ex && !seen.has(ex.id)) {
        seen.add(ex.id)
        exOptions.push({ id: ex.id, name: ex.name_pt })
      }
    }
    setExercises(exOptions)
    if (exOptions.length > 0 && !selectedExercise) {
      setSelectedExercise(exOptions[0].id)
    }

    setLoadingWeekly(false)
  }, [currentAcademy, profile])

  const loadExerciseEvolution = useCallback(async (exerciseId: string) => {
    if (!currentAcademy || !profile) return
    setLoadingExercise(true)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('set_logs')
      .select(`
        weight_kg, reps_done, created_at,
        workout_logs!inner ( created_at, student_id, academy_id, completed_at )
      `)
      .eq('exercise_id', exerciseId)
      .eq('workout_logs.student_id', profile.id)
      .eq('workout_logs.academy_id', currentAcademy.id)
      .not('workout_logs.completed_at', 'is', null)
      .not('weight_kg', 'is', null)
      .order('created_at', { ascending: true })

    if (error) { toast.error('Erro ao carregar evolução do exercício.'); setLoadingExercise(false); return }

    // Group by workout session date — max weight + total volume per session
    const bySession: Record<string, { date: string; maxWeight: number; totalVolume: number }> = {}
    for (const row of (data ?? [])) {
      const logDate = row.workout_logs?.created_at ?? row.created_at
      const dateKey = new Date(logDate).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
      if (!bySession[dateKey]) {
        bySession[dateKey] = { date: dateKey, maxWeight: 0, totalVolume: 0 }
      }
      const w = row.weight_kg ?? 0
      const r = row.reps_done ?? 0
      if (w > bySession[dateKey].maxWeight) bySession[dateKey].maxWeight = w
      bySession[dateKey].totalVolume += w * r
    }

    setExerciseData(
      Object.values(bySession).map((s, i) => ({ ...s, session: i + 1, totalVolume: Math.round(s.totalVolume) }))
    )
    setLoadingExercise(false)
  }, [currentAcademy, profile])

  useEffect(() => { void loadWeekly() }, [loadWeekly])
  useEffect(() => { if (selectedExercise) void loadExerciseEvolution(selectedExercise) }, [selectedExercise, loadExerciseEvolution])

  const selectedExerciseName = exercises.find((e) => e.id === selectedExercise)?.name ?? ''

  const totalVolume = weeklyData.reduce((acc, w) => acc + w.volume, 0)
  const totalSessions = weeklyData.reduce((acc, w) => acc + w.treinos, 0)
  const maxWeight = exerciseData.length > 0 ? Math.max(...exerciseData.map((e) => e.maxWeight)) : 0

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show">
        <h2 className="section-title">Evolução</h2>
        <p className="section-subtitle mt-1">Acompanhe seu progresso ao longo do tempo</p>
      </motion.div>

      {/* Tabs */}
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show"
        className="flex gap-1 p-1 glass rounded-xl w-fit border border-border/40"
      >
        {([
          { key: 'treinos', label: 'Treinos',  icon: Dumbbell  },
          { key: 'corpo',   label: 'Medidas',  icon: Ruler     },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === key
                ? 'bg-brand-500/15 text-brand-300 border border-brand-500/20'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </motion.div>

      {/* ── Tab: Corpo ── */}
      {activeTab === 'corpo' && <BodyEvolutionSection />}

      {/* ── Tab: Treinos ── */}
      {/* Loading */}
      {activeTab === 'treinos' && loadingWeekly && (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
        </div>
      )}

      {/* Empty */}
      {activeTab === 'treinos' && !loadingWeekly && weeklyData.length === 0 && (
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show"
          className="text-center py-20"
        >
          <div className="w-14 h-14 rounded-2xl bg-surface-200 flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-7 h-7 text-muted-foreground/40" />
          </div>
          <p className="font-semibold text-muted-foreground">Nenhum dado ainda</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Complete treinos para ver sua evolução aqui.
          </p>
        </motion.div>
      )}

      {activeTab === 'treinos' && !loadingWeekly && weeklyData.length > 0 && (
        <>
          {/* Summary */}
          <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show"
            className="grid grid-cols-3 gap-3"
          >
            {[
              { label: 'Treinos', value: String(totalSessions), sub: '8 semanas' },
              { label: 'Volume total', value: totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(0)}t` : `${totalVolume}kg`, sub: 'levantado' },
              { label: 'Melhor carga', value: maxWeight > 0 ? `${maxWeight}kg` : '—', sub: selectedExerciseName || 'selecione' },
            ].map(({ label, value, sub }) => (
              <div key={label} className="glass rounded-2xl p-4 text-center">
                <p className="font-display font-bold text-lg leading-none">{value}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>
                <p className="text-[11px] font-medium text-muted-foreground/60 mt-0.5">{label}</p>
              </div>
            ))}
          </motion.div>

          {/* Weekly frequency chart */}
          <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show"
            className="glass rounded-2xl p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-brand-400" />
              <h3 className="font-display font-bold text-sm">Frequência semanal</h3>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={weeklyData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="gradTreinos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1D9E75" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1D9E75" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="week" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone" dataKey="treinos"
                  stroke="#1D9E75" strokeWidth={2}
                  fill="url(#gradTreinos)"
                  dot={{ fill: '#1D9E75', strokeWidth: 0, r: 3 }}
                  activeDot={{ fill: '#2DD4A0', r: 5, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Weekly volume chart */}
          <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show"
            className="glass rounded-2xl p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Dumbbell className="w-4 h-4 text-cyan-400" />
              <h3 className="font-display font-bold text-sm">Volume semanal (kg)</h3>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={weeklyData} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                <defs>
                  <linearGradient id="gradVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="week" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone" dataKey="volume"
                  stroke="#06B6D4" strokeWidth={2}
                  fill="url(#gradVolume)"
                  dot={false}
                  activeDot={{ fill: '#22D3EE', r: 5, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Per-exercise load chart */}
          {exercises.length > 0 && (
            <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show"
              className="glass rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  <h3 className="font-display font-bold text-sm">Progressão de carga</h3>
                </div>

                {/* Exercise selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowExercisePicker(!showExercisePicker)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border/60 text-xs font-medium hover:bg-surface-200 transition-all"
                  >
                    <span className="truncate max-w-[160px]">{selectedExerciseName}</span>
                    <ChevronDown className={cn('w-3 h-3 transition-transform', showExercisePicker && 'rotate-180')} />
                  </button>

                  {showExercisePicker && (
                    <div className="absolute right-0 top-9 w-56 glass rounded-xl border border-border/60 shadow-xl z-10 overflow-hidden max-h-48 overflow-y-auto">
                      {exercises.map((ex) => (
                        <button
                          key={ex.id}
                          onClick={() => { setSelectedExercise(ex.id); setShowExercisePicker(false) }}
                          className={cn(
                            'w-full text-left px-3.5 py-2.5 text-xs transition-all',
                            ex.id === selectedExercise
                              ? 'text-brand-400 bg-brand-500/10'
                              : 'text-muted-foreground hover:text-foreground hover:bg-surface-200'
                          )}
                        >
                          {ex.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {loadingExercise ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-brand-400" />
                </div>
              ) : exerciseData.length < 2 ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <p className="text-sm text-muted-foreground">
                    {exerciseData.length === 0
                      ? 'Nenhum registro com carga para este exercício.'
                      : 'Faça mais sessões para ver a progressão.'}
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={exerciseData} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false}
                      tickFormatter={(v) => `${v}kg`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone" dataKey="maxWeight"
                      stroke="#EF9F27" strokeWidth={2.5}
                      dot={{ fill: '#EF9F27', strokeWidth: 0, r: 4 }}
                      activeDot={{ fill: '#FCD34D', r: 6, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </motion.div>
          )}
        </>
      )}
    </div>
  )
}
