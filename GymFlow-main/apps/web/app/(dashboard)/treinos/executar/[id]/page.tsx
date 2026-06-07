'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import {
  ChevronLeft, ChevronRight, Check, Timer, Dumbbell,
  X, Flame, Volume2, VolumeX, Trophy, Loader2,
} from 'lucide-react'

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
import { toast } from 'sonner'

import { cn, formatDuration } from '@/lib/utils'
import { useInterval } from '@/hooks/use-debounce'
import { ProgressRing } from '@/components/ui/progress-ring'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { cacheSheet, getCachedSheet, queueWorkout, type SheetSnapshot } from '@/lib/offline-store'

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
  const searchParams = useSearchParams()
  const { currentAcademy, profile, currentRole } = useAuthStore()
  const supabase = createClient()

  useEffect(() => {
    if (currentRole && currentRole !== 'student') {
      router.replace(`/treinos/${id}`)
    }
  }, [currentRole, id, router])

  // Dia ativo: URL param > hoje. Pra ficha weekly, define quais exercícios
  // executar (aluno pode antecipar/atrasar um treino mudando aqui).
  const initialDay = (() => {
    const fromUrl = searchParams.get('day')
    if (fromUrl !== null) {
      const n = parseInt(fromUrl, 10)
      if (!isNaN(n) && n >= 0 && n <= 6) return n
    }
    return new Date().getDay()
  })()

  const [exercises, setExercises] = useState<ExerciseSlot[]>([])
  const [sheetName, setSheetName] = useState('')
  const [scheduleType, setScheduleType] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [availableDays, setAvailableDays] = useState<number[]>([])
  const [selectedDay, setSelectedDay] = useState<number>(initialDay)
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
          id, name, schedule_type,
          sheet_exercises (
            id, sets, reps, rest_seconds, weight_suggestion, notes, order_index, day_index,
            exercise:exercises ( id, name_pt )
          )
        `)
        .eq('id', id)
        .eq('academy_id', currentAcademy.id)
        .single()

      // Sem internet (ou Supabase fora do ar): tenta cache local da ficha.
      // O cache foi gravado num load anterior com sucesso, então só funciona
      // se o aluno abriu a ficha pelo menos uma vez online.
      if (error || !data) {
        const cached = profile?.id
          ? await getCachedSheet(profile.id, id, selectedDay)
          : null
        if (cached) {
          await hydrateFromSnapshot(cached)
          return
        }
        toast.error('Ficha não encontrada.')
        router.push('/treinos')
        return
      }

      const sheetSchedule = (data.schedule_type ?? 'daily') as 'daily' | 'weekly' | 'monthly'
      setScheduleType(sheetSchedule)
      setSheetName(data.name)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allRows: any[] = (data.sheet_exercises ?? [])

      // Pra weekly: descobre quais dias tem exercício (alimenta o seletor).
      if (sheetSchedule === 'weekly') {
        const days = [...new Set(allRows.map((r) => r.day_index).filter((d) => d !== null && d !== undefined))] as number[]
        days.sort((a, b) => a - b)
        setAvailableDays(days)
        // Se o dia selecionado não tem exercício, cai pro primeiro dia disponível.
        if (days.length > 0 && !days.includes(selectedDay)) {
          setSelectedDay(days[0]!)
          return // o useEffect vai re-rodar com o novo selectedDay
        }
      }

      const slots: ExerciseSlot[] = allRows
        .filter((r) => sheetSchedule !== 'weekly' || r.day_index === selectedDay)
        .sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index)
        .map((se) => ({
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
        if (sheetSchedule === 'weekly') {
          toast.error(`Sem exercícios programados para ${DAY_LABELS[selectedDay]}.`)
        } else {
          toast.error('Esta ficha não tem exercícios. Adicione exercícios antes de executar.')
        }
        router.push(`/treinos/${id}`)
        return
      }

      setExercises(slots)

      // Carrega recordes históricos (máximo por exercício) para detectar PRs
      const { data: { user } } = await supabase.auth.getUser()
      const maxes: Record<string, number> = {}
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: prData } = await (supabase as any)
          .from('set_logs')
          .select('exercise_id, weight_kg, workout_logs!inner(student_id, academy_id)')
          .eq('workout_logs.student_id', user.id)
          .eq('workout_logs.academy_id', currentAcademy.id)
          .in('exercise_id', slots.map((s) => s.exerciseId))
          .not('weight_kg', 'is', null)
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

      // Draft separado por dia quando weekly — aluno pode ter rascunhos
      // distintos pra segunda e quarta sem misturar peso/reps.
      const draftKey = profile?.id
        ? `gymflow_draft_${profile.id}_${id}${sheetSchedule === 'weekly' ? `_d${selectedDay}` : ''}`
        : null
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

      // Snapshot pra hidratar offline em futuras execuções da mesma ficha+dia.
      if (user) {
        const snapshot: SheetSnapshot = {
          userId: user.id,
          sheetId: id,
          day: sheetSchedule === 'weekly' ? selectedDay : 0,
          sheetName: data.name,
          scheduleType: sheetSchedule,
          availableDays:
            sheetSchedule === 'weekly'
              ? ([...new Set(allRows.map((r) => r.day_index).filter((d) => d !== null && d !== undefined))] as number[]).sort((a, b) => a - b)
              : [],
          exercises: slots,
          prMaxWeights: maxes,
          cachedAt: Date.now(),
        }
        cacheSheet(snapshot)
      }

      setLoading(false)
    }

    async function hydrateFromSnapshot(snap: SheetSnapshot) {
      setScheduleType(snap.scheduleType)
      setSheetName(snap.sheetName)
      setAvailableDays(snap.availableDays)
      setExercises(snap.exercises)
      setPrMaxWeights(snap.prMaxWeights)

      const defaults: Record<string, SetData[]> = Object.fromEntries(
        snap.exercises.map((ex) => [
          ex.sheetExerciseId,
          Array.from({ length: ex.sets }, () => ({
            weight: ex.weightSuggestion ?? ('' as number | ''),
            reps: '' as number | '',
            done: false,
          })),
        ]),
      )

      const dKey = profile?.id
        ? `gymflow_draft_${profile.id}_${id}${snap.scheduleType === 'weekly' ? `_d${selectedDay}` : ''}`
        : null
      let restored = false
      if (dKey) {
        try {
          const raw = localStorage.getItem(dKey)
          if (raw) {
            const draft = JSON.parse(raw) as { setData: Record<string, SetData[]>; timer: number; exerciseIdx: number }
            if (snap.exercises.every((s) => draft.setData[s.sheetExerciseId] !== undefined)) {
              setSetData(draft.setData)
              setTimer(draft.timer)
              setExerciseIdx(Math.min(draft.exerciseIdx, snap.exercises.length - 1))
              setHasRestoredDraft(true)
              restored = true
            }
          }
        } catch { /* ignore */ }
      }
      if (!restored) setSetData(defaults)

      toast.info('Modo offline — usando ficha salva localmente.')
      setLoading(false)
    }

    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, currentAcademy, selectedDay])

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

  const draftKey = profile?.id
    ? `gymflow_draft_${profile.id}_${id}${scheduleType === 'weekly' ? `_d${selectedDay}` : ''}`
    : null

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

  // Marca/desmarca todas as séries do exercício atual de uma vez.
  // Para quem quer registrar o exercício como feito sem preencher série por série.
  function toggleExerciseDone() {
    if (!exercise) return
    const sets = setData[exercise.sheetExerciseId] ?? []
    const allDone = sets.length > 0 && sets.every((s) => s.done)
    setRestTimer(null)
    setSetData((prev) => ({
      ...prev,
      [exercise.sheetExerciseId]: prev[exercise.sheetExerciseId]!.map((s) => ({ ...s, done: !allDone })),
    }))
  }

  const currentExerciseDone = !!exercise && exerciseSets.length > 0 && exerciseSets.every((s) => s.done)

  const allExercisesDone = exercises.length > 0 && exercises.every((ex) =>
    (setData[ex.sheetExerciseId] ?? []).every((s) => s.done)
  )

  // Garante um client_id estável por sessão de treino, persistido no draft.
  // Usado como chave de idempotência na RPC — retries não duplicam workout_log.
  function ensureClientId(): string {
    if (!draftKey) return crypto.randomUUID()
    try {
      const raw = localStorage.getItem(draftKey)
      const draft = raw ? (JSON.parse(raw) as { clientId?: string }) : {}
      if (draft.clientId) return draft.clientId
      const newId = crypto.randomUUID()
      localStorage.setItem(draftKey, JSON.stringify({ ...draft, clientId: newId }))
      return newId
    } catch {
      return crypto.randomUUID()
    }
  }

  async function finishWorkout() {
    setSaving(true)
    try {
      if (!currentAcademy) throw new Error('Sem academia ativa')

      const setLogsPayload: object[] = []
      for (const ex of exercises) {
        const exSets = setData[ex.sheetExerciseId] ?? []
        exSets.forEach((set, idx) => {
          if (set.done) {
            setLogsPayload.push({
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

      const clientId = ensureClientId()

      const rpcParams = {
        p_sheet_id: id,
        p_academy_id: currentAcademy.id,
        p_duration_seconds: timer,
        p_set_logs: setLogsPayload,
        p_client_id: clientId,
      }

      // Se offline, nem tenta a RPC — vai direto pra queue.
      const isOnline = typeof navigator === 'undefined' ? true : navigator.onLine
      let queuedOffline = false

      if (isOnline) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any).rpc('complete_workout', rpcParams)
        if (error) {
          // Network fail / timeout: cai pra queue. Erro de RLS/validation também
          // cai pra queue — sync hook tenta de novo depois e dá toast se persistir.
          queuedOffline = true
        }
      } else {
        queuedOffline = true
      }

      if (queuedOffline) {
        const { data: { user } } = await supabase.auth.getUser()
        await queueWorkout({
          clientId,
          userId: user?.id ?? '',
          sheetId: id,
          academyId: currentAcademy.id,
          durationSeconds: timer,
          setLogs: setLogsPayload,
          queuedAt: Date.now(),
        })
        toast.success('Treino salvo localmente — sincroniza quando voltar a internet.')
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
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-100 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <p className="text-xs text-muted-foreground truncate max-w-[200px] sm:max-w-[280px]">
            {sheetName}
            {scheduleType === 'weekly' && (
              <span className="text-brand-400"> · {DAY_LABELS[selectedDay]}</span>
            )}
          </p>
          <p className="font-mono font-bold text-brand-400">{formatDuration(timer)}</p>
        </div>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-100 transition-all"
        >
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </div>

      {/* Seletor de dia — só weekly. Permite antecipar/atrasar treino do dia. */}
      {scheduleType === 'weekly' && availableDays.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {availableDays.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDay(d)}
              className={cn(
                'flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all min-w-[44px]',
                selectedDay === d
                  ? 'bg-brand-500 text-white shadow-[0_0_12px_rgba(29,158,117,0.3)]'
                  : 'bg-surface-200 text-muted-foreground hover:text-foreground hover:bg-surface-300'
              )}
            >
              {DAY_LABELS[d]}
            </button>
          ))}
        </div>
      )}

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
                  'grid grid-cols-[2rem_1fr_1fr_2.5rem] gap-2 items-center p-2 rounded-xl transition-all',
                  isPrRow
                    ? 'bg-amber-500/10 border border-amber-500/30'
                    : set.done
                    ? 'bg-emerald-500/8 border border-emerald-500/15'
                    : 'bg-surface-100'
                )}
              >
                <span className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold',
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
                  className={cn('field text-center py-1.5 text-sm font-mono', set.done && 'opacity-60')}
                />

                <input
                  type="number"
                  inputMode="numeric"
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
            )})}
          </div>

          {/* Marcar exercício inteiro como concluído (sem preencher série a série) */}
          <button
            onClick={toggleExerciseDone}
            className={cn(
              'w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 border',
              currentExerciseDone
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15'
                : 'bg-surface-100 text-muted-foreground border-border/60 hover:text-foreground hover:bg-surface-200'
            )}
          >
            <Check className="w-4 h-4" />
            {currentExerciseDone ? 'Concluído — desmarcar' : 'Marcar como concluído'}
          </button>
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
