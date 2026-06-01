'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import {
  ChevronLeft, ChevronRight, Check, Timer, Dumbbell,
  X, Flame, Volume2, VolumeX, Trophy, Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

import { cn, formatDuration } from '@/lib/utils'
import { useInterval } from '@/hooks/use-debounce'
import { ProgressRing } from '@/components/ui/progress-ring'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'

interface ExerciseSlot {
  sheetExerciseId: string
  exerciseId: string
  name: string
  sets: number
  reps: string
  restSeconds: number
  weightSuggestion: number | null
  notes: string | null
}

interface SetData {
  weight: number | ''
  reps: number | ''
  done: boolean
}

export default function ExecutarTreinoPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { currentAcademy, profile } = useAuthStore()
  const supabase = createClient()

  const [exercises, setExercises] = useState<ExerciseSlot[]>([])
  const [sheetName, setSheetName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [exerciseIdx, setExerciseIdx] = useState(0)
  const [setData, setSetData] = useState<Record<string, SetData[]>>({})
  const [timer, setTimer] = useState(0)
  const [restTimer, setRestTimer] = useState<number | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [isCompleted, setIsCompleted] = useState(false)
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false)
  const [showExitDialog, setShowExitDialog] = useState(false)
  const [prMaxWeights, setPrMaxWeights] = useState<Record<string, number>>({})
  const [lastPrKey, setLastPrKey] = useState<string | null>(null)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    async function load() {
      if (!currentAcademy) { setLoading(false); return }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('workout_sheets')
        .select(`
          id, name,
          sheet_exercises (
            id, sets, reps, rest_seconds, weight_suggestion, notes, order_index,
            exercise:exercises ( id, name_pt )
          )
        `)
        .eq('id', id)
        .eq('academy_id', currentAcademy.id)
        .single()

      if (error || !data) {
        toast.error('Ficha não encontrada.')
        router.push('/treinos')
        return
      }

      setSheetName(data.name)

      const slots: ExerciseSlot[] = (data.sheet_exercises ?? [])
        .sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((se: any) => ({
          sheetExerciseId: se.id,
          exerciseId: se.exercise.id,
          name: se.exercise.name_pt,
          sets: se.sets,
          reps: se.reps,
          restSeconds: se.rest_seconds,
          weightSuggestion: se.weight_suggestion,
          notes: se.notes,
        }))

      if (slots.length === 0) {
        toast.error('Esta ficha não tem exercícios. Adicione exercícios antes de executar.')
        router.push(`/treinos/${id}`)
        return
      }

      setExercises(slots)

      // Carrega recordes históricos (máximo por exercício) para detectar PRs
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: prData } = await (supabase as any)
          .from('set_logs')
          .select('exercise_id, weight_kg, workout_logs!inner(student_id, academy_id)')
          .eq('workout_logs.student_id', user.id)
          .eq('workout_logs.academy_id', currentAcademy.id)
          .in('exercise_id', slots.map((s) => s.exerciseId))
          .not('weight_kg', 'is', null)
        const maxes: Record<string, number> = {}
        for (const row of (prData ?? [])) {
          if (maxes[row.exercise_id] === undefined || row.weight_kg > maxes[row.exercise_id]!) {
            maxes[row.exercise_id] = row.weight_kg
          }
        }
        setPrMaxWeights(maxes)
      }

      const defaultSetData: Record<string, SetData[]> = Object.fromEntries(
        slots.map((ex) => [
          ex.sheetExerciseId,
          Array.from({ length: ex.sets }, () => ({
            weight: ex.weightSuggestion ?? ('' as number | ''),
            reps: '' as number | '',
            done: false,
          })),
        ])
      )

      const draftKey = profile?.id ? `gymflow_draft_${profile.id}_${id}` : null
      let restored = false
      if (draftKey) {
        try {
          const raw = localStorage.getItem(draftKey)
          if (raw) {
            const draft = JSON.parse(raw) as { setData: Record<string, SetData[]>; timer: number; exerciseIdx: number }
            const compatible = slots.every((s) => draft.setData[s.sheetExerciseId] !== undefined)
            if (compatible) {
              setSetData(draft.setData)
              setTimer(draft.timer)
              setExerciseIdx(Math.min(draft.exerciseIdx, slots.length - 1))
              setHasRestoredDraft(true)
              restored = true
            }
          }
        } catch { /* draft inválido — ignorar */ }
      }
      if (!restored) setSetData(defaultSetData)

      setLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, currentAcademy])

  useInterval(() => setTimer((t) => t + 1), loading || isCompleted ? null : 1000)

  useInterval(
    () => setRestTimer((t) => {
      if (t === null) return null
      if (t <= 1) {
        if (soundEnabled) {
          try {
            const ctx = new AudioContext()
            const osc = ctx.createOscillator()
            osc.connect(ctx.destination)
            osc.frequency.value = 440
            osc.start()
            osc.stop(ctx.currentTime + 0.4)
          } catch { /* audio not available */ }
        }
        navigator.vibrate?.([150, 80, 150])
        return null
      }
      if (t === 4 && soundEnabled) {
        try {
          const ctx = new AudioContext()
          const osc = ctx.createOscillator()
          osc.connect(ctx.destination)
          osc.frequency.value = 880
          osc.start()
          osc.stop(ctx.currentTime + 0.1)
        } catch { /* audio not available */ }
      }
      return t - 1
    }),
    restTimer !== null ? 1000 : null
  )

  const draftKey = profile?.id ? `gymflow_draft_${profile.id}_${id}` : null

  // WakeLock — mantém tela ligada durante o treino
  useEffect(() => {
    if (loading || isCompleted) return

    async function acquireWakeLock() {
      try {
        wakeLockRef.current = await navigator.wakeLock?.request('screen') ?? null
      } catch { /* dispositivo não suporta ou permissão negada — ignorar silenciosamente */ }
    }

    function onVisibilityChange() {
      if (document.visibilityState === 'visible') acquireWakeLock()
    }

    acquireWakeLock()
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      wakeLockRef.current?.release().catch(() => {})
      wakeLockRef.current = null
    }
  }, [loading, isCompleted])

  // Persist draft on set data / navigation changes
  useEffect(() => {
    if (!draftKey || exercises.length === 0 || isCompleted) return
    localStorage.setItem(draftKey, JSON.stringify({ setData, timer, exerciseIdx }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setData, exerciseIdx])

  // Keep timer in sync every 10s
  useInterval(() => {
    if (!draftKey || exercises.length === 0 || isCompleted) return
    const raw = localStorage.getItem(draftKey)
    if (!raw) return
    try {
      localStorage.setItem(draftKey, JSON.stringify({ ...JSON.parse(raw), timer }))
    } catch { /* ignore */ }
  }, !loading && !isCompleted && !!draftKey && exercises.length > 0 ? 10000 : null)

  const exercise = exercises[exerciseIdx]
  const exerciseSets = exercise ? (setData[exercise.sheetExerciseId] ?? []) : []

  const totalSets = exercises.reduce((acc, ex) => acc + ex.sets, 0)
  const completedSets = Object.values(setData).flat().filter((s) => s.done).length
  const progress = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0

  function updateSet(setIdx: number, field: keyof SetData, value: SetData[typeof field]) {
    if (!exercise) return
    setSetData((prev) => ({
      ...prev,
      [exercise.sheetExerciseId]: prev[exercise.sheetExerciseId]!.map((s, i) =>
        i === setIdx ? { ...s, [field]: value } : s
      ),
    }))
  }

  function completeSet(setIdx: number) {
    const set = exerciseSets[setIdx]
    if (!set || set.done || !exercise) return

    const weight = typeof set.weight === 'number' ? set.weight : 0
    const historicalMax = prMaxWeights[exercise.exerciseId] ?? 0
    const isPR = weight > 0 && weight > historicalMax

    updateSet(setIdx, 'done', true)
    setRestTimer(exercise.restSeconds)

    if (isPR) {
      const prKey = `${exercise.sheetExerciseId}-${setIdx}`
      setLastPrKey(prKey)
      setPrMaxWeights((prev) => ({ ...prev, [exercise.exerciseId]: weight }))
      toast(`🏆 Novo recorde! ${weight} kg no ${exercise.name}`, {
        style: {
          background: 'rgba(120,53,15,0.9)',
          border: '1px solid #EF9F27',
          color: '#FDE68A',
        },
      })
    } else {
      toast.success(`Série ${setIdx + 1} concluída! 💪`)
    }
  }

  const allExercisesDone = exercises.length > 0 && exercises.every((ex) =>
    (setData[ex.sheetExerciseId] ?? []).every((s) => s.done)
  )

  async function finishWorkout() {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !currentAcademy) throw new Error('Não autenticado')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: log, error: logError } = await (supabase as any)
        .from('workout_logs')
        .insert({
          student_id: user.id,
          sheet_id: id,
          academy_id: currentAcademy.id,
          duration_seconds: timer,
          completed_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (logError) throw logError

      const setLogsToInsert: object[] = []
      for (const ex of exercises) {
        const exSets = setData[ex.sheetExerciseId] ?? []
        exSets.forEach((set, idx) => {
          if (set.done) {
            setLogsToInsert.push({
              workout_log_id: log.id,
              sheet_exercise_id: ex.sheetExerciseId,
              exercise_id: ex.exerciseId,
              set_number: idx + 1,
              reps_done: Number(set.reps) || 0,
              weight_kg: set.weight !== '' ? Number(set.weight) : null,
              is_completed: true,
            })
          }
        })
      }

      if (setLogsToInsert.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: setsError } = await (supabase as any).from('set_logs').insert(setLogsToInsert)
        if (setsError) throw setsError
      }

      if (draftKey) localStorage.removeItem(draftKey)
      setIsCompleted(true)
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Erro ao salvar treino.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="w-9 h-9 rounded-xl" />
          <div className="flex flex-col items-center gap-1">
            <Skeleton className="h-3 w-28 rounded" />
            <Skeleton className="h-5 w-16 rounded" />
          </div>
          <Skeleton className="w-9 h-9 rounded-xl" />
        </div>
        <div className="glass rounded-2xl p-4 space-y-3">
          <Skeleton className="h-2 w-full rounded-full" />
          <div className="flex justify-center gap-1.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="w-1.5 h-1.5 rounded-full" />
            ))}
          </div>
        </div>
        <div className="glass rounded-2xl p-5 space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-6 w-48 rounded" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        </div>
        <div className="flex gap-3">
          <Skeleton className="flex-1 h-12 rounded-xl" />
          <Skeleton className="flex-1 h-12 rounded-xl" />
        </div>
      </div>
    )
  }

  if (isCompleted) {
    return (
      <WorkoutComplete
        timer={timer}
        completedSets={completedSets}
        onViewProgress={() => router.push('/evolucao')}
        onExit={() => router.push('/treinos')}
      />
    )
  }

  if (!exercise) return null

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowExitDialog(true)}
          className="p-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-100 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <p className="text-xs text-muted-foreground truncate max-w-[160px]">{sheetName}</p>
          <p className="font-mono font-bold text-xl tabular-nums text-brand-400">{formatDuration(timer)}</p>
        </div>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-100 transition-all"
        >
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </div>

      {/* Draft restored banner */}
      <AnimatePresence>
        {hasRestoredDraft && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center justify-between px-4 py-2.5 rounded-xl border border-amber-500/20 bg-amber-500/8 text-sm"
          >
            <span className="text-amber-400 font-medium">↩ Treino anterior restaurado</span>
            <button
              onClick={() => setHasRestoredDraft(false)}
              className="text-muted-foreground hover:text-foreground text-xs ml-3"
            >
              ok
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress */}
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">{completedSets}/{totalSets} séries</span>
          <span className="text-xs font-bold text-brand-400">{progress}%</span>
        </div>
        <div className="progress-bar">
          <motion.div
            className="progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        <div className="flex items-center gap-1.5 mt-3 justify-center">
          {exercises.map((ex, i) => {
            const exSets = setData[ex.sheetExerciseId] ?? []
            const done = exSets.every((s) => s.done)
            const partial = exSets.some((s) => s.done) && !done
            return (
              <button
                key={ex.sheetExerciseId}
                onClick={() => setExerciseIdx(i)}
                aria-label={`Exercício ${i + 1}`}
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  i === exerciseIdx ? 'w-6' : 'w-2',
                  done ? 'bg-emerald-500' : partial ? 'bg-brand-400' : i === exerciseIdx ? 'bg-brand-500' : 'bg-surface-300'
                )}
              />
            )
          })}
        </div>
      </div>

      {/* Rest timer overlay */}
      <AnimatePresence>
        {restTimer !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="glass rounded-2xl p-6 text-center border border-cyan-500/20 shadow-glow-cyan"
          >
            <p className="text-sm font-medium text-muted-foreground mb-4">⏱️ Descansando</p>
            <div className="flex items-center justify-center mb-4">
              <ProgressRing value={restTimer} max={exercise.restSeconds} size={108} color="#06B6D4" strokeWidth={6}>
                <span className="font-mono font-black text-4xl tabular-nums text-cyan-400">{restTimer}</span>
              </ProgressRing>
            </div>
            <p className="text-sm text-muted-foreground">Próxima série em breve</p>
            <button
              onClick={() => setRestTimer(null)}
              className="mt-4 px-5 py-2.5 rounded-xl border border-cyan-500/20 text-sm font-medium text-cyan-400 hover:bg-cyan-500/10 transition-all"
            >
              Pular descanso
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exercise card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={exerciseIdx}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="glass rounded-2xl p-5 space-y-4"
        >
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">
                Exercício {exerciseIdx + 1} de {exercises.length}
              </span>
              <span className="badge-primary text-[10px]">
                {exercise.sets} x {exercise.reps}
              </span>
            </div>
            <h3 className="font-display font-bold text-xl leading-snug">{exercise.name}</h3>
            {exercise.notes && (
              <p className="text-xs text-muted-foreground mt-1 italic">{exercise.notes}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-[2.5rem_1fr_1fr_3rem] gap-2 text-[10px] text-muted-foreground font-medium uppercase tracking-wide px-1">
              <span>Série</span><span>Peso (kg)</span><span>Reps</span><span></span>
            </div>

            {exerciseSets.map((set, i) => {
              const prKey = `${exercise.sheetExerciseId}-${i}`
              const isPrRow = lastPrKey === prKey
              return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  'grid grid-cols-[2.5rem_1fr_1fr_3rem] gap-2 items-center p-2 rounded-xl transition-all',
                  isPrRow
                    ? 'bg-amber-500/10 border border-amber-500/30'
                    : set.done
                    ? 'bg-emerald-500/8 border border-emerald-500/15'
                    : 'bg-surface-100'
                )}
              >
                <span className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold',
                  isPrRow
                    ? 'bg-amber-500/20 text-amber-400'
                    : set.done
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-surface-200 text-muted-foreground'
                )}>
                  {isPrRow ? <Trophy className="w-3.5 h-3.5" /> : set.done ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </span>

                <input
                  type="number"
                  inputMode="decimal"
                  value={set.weight}
                  onChange={(e) => updateSet(i, 'weight', e.target.value === '' ? '' : Number(e.target.value))}
                  disabled={set.done}
                  placeholder={String(exercise.weightSuggestion ?? 0)}
                  className={cn('field text-center py-2.5 text-base font-mono', set.done && 'opacity-60')}
                />

                <input
                  type="number"
                  inputMode="numeric"
                  value={set.reps}
                  onChange={(e) => updateSet(i, 'reps', e.target.value === '' ? '' : Number(e.target.value))}
                  disabled={set.done}
                  placeholder={exercise.reps.split('-')[0]}
                  className={cn('field text-center py-2.5 text-base font-mono', set.done && 'opacity-60')}
                />

                <button
                  onClick={() => completeSet(i)}
                  disabled={set.done}
                  className={cn(
                    'w-11 h-11 rounded-xl flex items-center justify-center transition-all',
                    set.done
                      ? 'bg-emerald-500/20 text-emerald-400 cursor-default'
                      : 'bg-brand-500/15 text-brand-400 hover:bg-brand-500/25 active:scale-90'
                  )}
                >
                  <Check className="w-5 h-5" />
                </button>
              </motion.div>
            )})}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Exit confirmation dialog */}
      <AnimatePresence>
        {showExitDialog && (
          <>
            <motion.div
              key="exit-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowExitDialog(false)}
            />
            <motion.div
              key="exit-dialog"
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 12 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-x-4 bottom-8 sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:w-[360px] z-50 glass rounded-2xl p-6 border border-border/60 shadow-2xl"
            >
              <div className="w-11 h-11 rounded-2xl bg-amber-500/15 flex items-center justify-center mb-4">
                <X className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="font-display font-bold text-base">Sair do treino?</h3>
              <p className="text-sm text-muted-foreground mt-1.5">
                Seu progresso está salvo como rascunho e será restaurado na próxima vez.
              </p>
              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => setShowExitDialog(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border/60 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-surface-200 transition-all"
                >
                  Continuar treino
                </button>
                <button
                  onClick={() => router.back()}
                  className="flex-1 py-2.5 rounded-xl bg-red-500/15 text-red-400 border border-red-500/20 text-sm font-bold hover:bg-red-500/25 transition-all"
                >
                  Sair
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setExerciseIdx((i) => Math.max(i - 1, 0))}
          disabled={exerciseIdx === 0}
          className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl border border-border/60 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-surface-100 transition-all disabled:opacity-30"
        >
          <ChevronLeft className="w-5 h-5" /> Anterior
        </button>

        {exerciseIdx < exercises.length - 1 ? (
          <button
            onClick={() => setExerciseIdx((i) => i + 1)}
            className="flex-1 btn-primary py-4 rounded-xl text-sm flex items-center justify-center gap-2"
          >
            Próximo <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={finishWorkout}
            disabled={!allExercisesDone || saving}
            className={cn(
              'flex-1 py-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2',
              allExercisesDone && !saving
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-glow-emerald'
                : 'bg-surface-200 text-muted-foreground cursor-not-allowed'
            )}
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Trophy className="w-5 h-5" /> Concluir treino</>}
          </button>
        )}
      </div>
    </div>
  )
}

function WorkoutComplete({
  timer,
  completedSets,
  onViewProgress,
  onExit,
}: {
  timer: number
  completedSets: number
  onViewProgress: () => void
  onExit: () => void
}) {
  const [ringValue, setRingValue] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setRingValue(100), 500)
    return () => clearTimeout(t)
  }, [])

  const particles = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        angle: (i / 14) * 360,
        color: i % 3 === 0 ? '#10B981' : i % 3 === 1 ? '#1D9E75' : '#06B6D4',
        delay: 0.3 + (i % 5) * 0.07,
        distance: 55 + (i % 4) * 10,
      })),
    []
  )

  const staggerStats = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1, delayChildren: 0.7 } },
  }
  const statFade = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-sm mx-auto text-center space-y-6 py-10"
    >
      {/* Trophy com anel de progresso + partículas */}
      <div className="flex justify-center">
        <div className="relative">
          <ProgressRing value={ringValue} max={100} size={112} color="#10B981" strokeWidth={4}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
              className="w-[82px] h-[82px] rounded-3xl bg-gradient-to-br from-emerald-500/30 to-brand-500/30 flex items-center justify-center border border-emerald-500/20 shadow-glow-emerald"
            >
              <Trophy className="w-10 h-10 text-emerald-400" />
            </motion.div>
          </ProgressRing>

          {particles.map((p, i) => (
            <motion.div
              key={i}
              className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full"
              style={{ background: p.color, marginLeft: -4, marginTop: -4 }}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
              animate={{
                x: Math.cos((p.angle * Math.PI) / 180) * p.distance,
                y: Math.sin((p.angle * Math.PI) / 180) * p.distance,
                opacity: [0, 1, 1, 0],
                scale: [0, 1.4, 1, 0],
              }}
              transition={{ delay: p.delay, duration: 0.9, ease: 'easeOut' }}
            />
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-3xl font-display font-extrabold gradient-text">Treino concluído!</h2>
        <p className="text-muted-foreground mt-2">Excelente trabalho! Continue assim 💪</p>
      </div>

      <motion.div
        variants={staggerStats}
        initial="hidden"
        animate="show"
        className="glass rounded-2xl p-5 grid grid-cols-3 gap-4"
      >
        {[
          { label: 'Duração', value: formatDuration(timer), icon: Timer },
          { label: 'Séries', value: String(completedSets), icon: Dumbbell },
          { label: 'Calorias', value: '~320', icon: Flame },
        ].map(({ label, value, icon: Icon }) => (
          <motion.div key={label} variants={statFade} className="text-center">
            <Icon className="w-4 h-4 text-muted-foreground mx-auto mb-1.5" />
            <p className="font-display font-bold text-lg">{value}</p>
            <p className="text-[10px] text-muted-foreground">{label}</p>
          </motion.div>
        ))}
      </motion.div>

      <div className="flex flex-col gap-2">
        <button onClick={onViewProgress} className="btn-primary w-full py-3.5 rounded-xl font-semibold">
          Ver meu progresso
        </button>
        <button onClick={onExit} className="btn-ghost w-full py-2 text-sm">
          Voltar para fichas
        </button>
      </div>
    </motion.div>
  )
}
