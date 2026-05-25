'use client'

import { useState, useEffect, useCallback } from 'react'
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
  const { currentAcademy } = useAuthStore()
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
      setSetData(
        Object.fromEntries(
          slots.map((ex) => [
            ex.sheetExerciseId,
            Array.from({ length: ex.sets }, () => ({
              weight: ex.weightSuggestion ?? '',
              reps: '' as number | '',
              done: false,
            })),
          ])
        )
      )
      setLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, currentAcademy])

  useInterval(() => setTimer((t) => t + 1), loading || isCompleted ? null : 1000)

  useInterval(
    () => setRestTimer((t) => {
      if (t === null || t <= 1) return null
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
    updateSet(setIdx, 'done', true)
    setRestTimer(exercise.restSeconds)
    toast.success(`Série ${setIdx + 1} concluída! 💪`)
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

      setIsCompleted(true)
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Erro ao salvar treino.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
      </div>
    )
  }

  if (isCompleted) {
    return (
      <WorkoutComplete
        timer={timer}
        completedSets={completedSets}
        onViewProgress={() => router.push('/frequencia')}
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
          onClick={() => router.back()}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-100 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <p className="text-xs text-muted-foreground truncate max-w-[160px]">{sheetName}</p>
          <p className="font-mono font-bold text-brand-400">{formatDuration(timer)}</p>
        </div>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-100 transition-all"
        >
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </div>

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
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  i === exerciseIdx ? 'w-6' : 'w-1.5',
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
            <p className="text-xs text-muted-foreground mb-3">⏱️ Descanso</p>
            <div className="flex items-center justify-center mb-3">
              <ProgressRing value={restTimer} max={exercise.restSeconds} size={80} color="#06B6D4">
                <span className="font-mono font-black text-2xl text-cyan-400">{restTimer}</span>
              </ProgressRing>
            </div>
            <p className="text-sm text-muted-foreground">Próxima série em breve</p>
            <button onClick={() => setRestTimer(null)} className="mt-3 text-xs text-cyan-400 hover:underline">
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
            <h3 className="font-display font-bold text-lg leading-snug">{exercise.name}</h3>
            {exercise.notes && (
              <p className="text-xs text-muted-foreground mt-1 italic">{exercise.notes}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-[2rem_1fr_1fr_2.5rem] gap-2 text-[10px] text-muted-foreground font-medium uppercase tracking-wide px-1">
              <span>Série</span><span>Peso (kg)</span><span>Reps</span><span></span>
            </div>

            {exerciseSets.map((set, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  'grid grid-cols-[2rem_1fr_1fr_2.5rem] gap-2 items-center p-2 rounded-xl transition-all',
                  set.done ? 'bg-emerald-500/8 border border-emerald-500/15' : 'bg-surface-100'
                )}
              >
                <span className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold',
                  set.done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-surface-200 text-muted-foreground'
                )}>
                  {set.done ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </span>

                <input
                  type="number"
                  value={set.weight}
                  onChange={(e) => updateSet(i, 'weight', e.target.value === '' ? '' : Number(e.target.value))}
                  disabled={set.done}
                  placeholder={String(exercise.weightSuggestion ?? 0)}
                  className={cn('field text-center py-1.5 text-sm font-mono', set.done && 'opacity-60')}
                />

                <input
                  type="number"
                  value={set.reps}
                  onChange={(e) => updateSet(i, 'reps', e.target.value === '' ? '' : Number(e.target.value))}
                  disabled={set.done}
                  placeholder={exercise.reps.split('-')[0]}
                  className={cn('field text-center py-1.5 text-sm font-mono', set.done && 'opacity-60')}
                />

                <button
                  onClick={() => completeSet(i)}
                  disabled={set.done}
                  className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center transition-all',
                    set.done
                      ? 'bg-emerald-500/20 text-emerald-400 cursor-default'
                      : 'bg-brand-500/15 text-brand-400 hover:bg-brand-500/25 active:scale-90'
                  )}
                >
                  <Check className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setExerciseIdx((i) => Math.max(i - 1, 0))}
          disabled={exerciseIdx === 0}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-border/60 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-surface-100 transition-all disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4" /> Anterior
        </button>

        {exerciseIdx < exercises.length - 1 ? (
          <button
            onClick={() => setExerciseIdx((i) => i + 1)}
            className="flex-1 btn-primary py-3 rounded-xl text-sm"
          >
            Próximo <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={finishWorkout}
            disabled={!allExercisesDone || saving}
            className={cn(
              'flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2',
              allExercisesDone && !saving
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-glow-emerald'
                : 'bg-surface-200 text-muted-foreground cursor-not-allowed'
            )}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trophy className="w-4 h-4" /> Concluir treino</>}
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
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-sm mx-auto text-center space-y-6 py-10"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
        className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-500/30 to-brand-500/30 flex items-center justify-center mx-auto border border-emerald-500/20 shadow-glow-emerald"
      >
        <Trophy className="w-12 h-12 text-emerald-400" />
      </motion.div>

      <div>
        <h2 className="text-3xl font-display font-extrabold gradient-text">Treino concluído!</h2>
        <p className="text-muted-foreground mt-2">Excelente trabalho! Continue assim 💪</p>
      </div>

      <div className="glass rounded-2xl p-5 grid grid-cols-3 gap-4">
        {[
          { label: 'Duração', value: formatDuration(timer), icon: Timer },
          { label: 'Séries', value: String(completedSets), icon: Dumbbell },
          { label: 'Calorias', value: '~320', icon: Flame },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="text-center">
            <Icon className="w-4 h-4 text-muted-foreground mx-auto mb-1.5" />
            <p className="font-display font-bold text-lg">{value}</p>
            <p className="text-[10px] text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

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
