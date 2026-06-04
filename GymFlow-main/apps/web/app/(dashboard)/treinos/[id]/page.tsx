'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Dumbbell, Target, Play,
  Plus, Trash2, Loader2, Check, X,
  ClipboardList, CalendarDays, Pencil,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  }),
}

interface SheetExercise {
  id: string
  sets: number
  reps: string
  rest_seconds: number
  weight_suggestion: number | null
  notes: string | null
  order_index: number
  day_index: number | null
  exercise: {
    id: string
    name_pt: string
    muscle_groups: string[]
  }
}

interface WorkoutSheet {
  id: string
  name: string
  goal: string | null
  description: string | null
  is_active: boolean
  created_at: string
  scheduled_days: number[]
  schedule_type: 'daily' | 'weekly' | 'monthly'
  student?: { full_name: string | null } | null
  exercises: SheetExercise[]
}

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const WEEK_LABELS = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4']

const SCHEDULE_LABELS: Record<string, string> = {
  daily: 'Diária',
  weekly: 'Semanal',
  monthly: 'Mensal',
}

function DayPicker({ days, onChange, saving }: {
  days: number[]
  onChange: (days: number[]) => void
  saving: boolean
}) {
  function toggle(d: number) {
    onChange(days.includes(d) ? days.filter((x) => x !== d) : [...days, d].sort())
  }

  return (
    <div className="flex gap-1.5 flex-wrap">
      {DAY_LABELS.map((label, i) => {
        const active = days.includes(i)
        return (
          <button
            key={i}
            onClick={() => toggle(i)}
            disabled={saving}
            className={cn(
              'w-10 h-10 rounded-xl text-xs font-bold transition-all',
              active
                ? 'bg-brand-500 text-white shadow-[0_0_12px_rgba(29,158,117,0.3)]'
                : 'bg-surface-200 text-muted-foreground hover:text-foreground hover:bg-surface-300'
            )}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

function ExerciseRow({ ex, isPersonal, onDelete, onUpdate }: {
  ex: SheetExercise
  isPersonal: boolean
  onDelete: (id: string) => void
  onUpdate: (id: string, patch: Partial<Pick<SheetExercise, 'sets' | 'reps' | 'rest_seconds' | 'weight_suggestion' | 'notes'>>) => void
}) {
  const [confirming, setConfirming] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    sets: String(ex.sets),
    reps: ex.reps,
    rest_seconds: String(ex.rest_seconds),
    weight_suggestion: ex.weight_suggestion != null ? String(ex.weight_suggestion) : '',
    notes: ex.notes ?? '',
  })

  function handleDeleteClick() {
    if (!confirming) {
      setConfirming(true)
      setTimeout(() => setConfirming(false), 3000)
    } else {
      onDelete(ex.id)
    }
  }

  async function handleSave() {
    setSaving(true)
    const patch = {
      sets: parseInt(form.sets) || ex.sets,
      reps: form.reps || ex.reps,
      rest_seconds: parseInt(form.rest_seconds) || ex.rest_seconds,
      weight_suggestion: form.weight_suggestion ? parseFloat(form.weight_suggestion) : null,
      notes: form.notes || null,
    }
    await onUpdate(ex.id, patch)
    setSaving(false)
    setEditing(false)
  }

  if (editing) {
    return (
      <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 rounded-xl bg-surface-100 border border-brand-500/20 space-y-3">
        <p className="font-semibold text-sm flex items-center gap-2">
          <Dumbbell className="w-3.5 h-3.5 text-brand-400" />
          {ex.exercise.name_pt}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Séries</label>
            <input type="number" min={1} value={form.sets} onChange={(e) => setForm((f) => ({ ...f, sets: e.target.value }))} className="field text-sm py-2" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Reps</label>
            <input value={form.reps} onChange={(e) => setForm((f) => ({ ...f, reps: e.target.value }))} placeholder="ex: 8-12" className="field text-sm py-2" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Descanso (s)</label>
            <input type="number" min={0} value={form.rest_seconds} onChange={(e) => setForm((f) => ({ ...f, rest_seconds: e.target.value }))} className="field text-sm py-2" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Carga (kg)</label>
            <input type="number" min={0} step={0.5} value={form.weight_suggestion} onChange={(e) => setForm((f) => ({ ...f, weight_suggestion: e.target.value }))} placeholder="Opcional" className="field text-sm py-2" />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Observações</label>
          <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Opcional" className="field text-sm py-2" />
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={handleSave} disabled={saving} className="flex-1 btn-primary py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Salvar
          </button>
          <button onClick={() => setEditing(false)} className="flex-1 btn-secondary py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5">
            <X className="w-3.5 h-3.5" /> Cancelar
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex items-start gap-3 p-3.5 rounded-xl bg-surface-100 hover:bg-surface-200 transition-all group"
    >
      <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Dumbbell className="w-3.5 h-3.5 text-brand-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{ex.exercise.name_pt}</p>
        <div className="flex flex-wrap gap-2 mt-1">
          <span className="text-xs text-muted-foreground">{ex.sets} séries × {ex.reps} reps</span>
          {ex.rest_seconds > 0 && (
            <span className="text-xs text-muted-foreground">· {ex.rest_seconds}s descanso</span>
          )}
          {ex.weight_suggestion && (
            <span className="text-xs text-brand-400 font-medium">· ~{ex.weight_suggestion}kg</span>
          )}
        </div>
        {ex.notes && (
          <p className="text-xs text-muted-foreground/70 italic mt-1">{ex.notes}</p>
        )}
        {ex.exercise.muscle_groups?.length > 0 && (
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {ex.exercise.muscle_groups.slice(0, 3).map((mg) => (
              <span key={mg} className="badge text-[9px] py-0 px-1.5">{mg}</span>
            ))}
          </div>
        )}
      </div>
      {isPersonal && (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <button
            onClick={() => setEditing(true)}
            title="Editar"
            className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-brand-400 hover:bg-brand-500/10 transition-all"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDeleteClick}
            title={confirming ? 'Clique novamente para confirmar' : 'Remover exercício'}
            className={cn(
              'p-1.5 rounded-lg transition-all text-xs',
              confirming
                ? 'text-red-400 bg-red-500/10 font-semibold px-2'
                : 'text-muted-foreground/40 hover:text-red-400 hover:bg-red-500/10'
            )}
          >
            {confirming ? 'Confirmar?' : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}
    </motion.div>
  )
}

export default function WorkoutSheetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { currentRole, currentAcademy } = useAuthStore()
  const supabase = createClient()
  const isPersonal = currentRole === 'owner' || currentRole === 'personal'

  const [sheet, setSheet] = useState<WorkoutSheet | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [savingDays, setSavingDays] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay())

  useEffect(() => {
    async function load() {
      if (!currentAcademy) { setLoading(false); return }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('workout_sheets')
        .select(`
          id, name, goal, description, is_active, created_at, scheduled_days, schedule_type,
          sheet_exercises (
            id, sets, reps, rest_seconds, weight_suggestion, notes, order_index, day_index,
            exercise:exercises ( id, name_pt, muscle_groups )
          )
        `)
        .eq('id', id)
        .eq('academy_id', currentAcademy.id)
        .single()

      if (error || !data) { setNotFound(true); setLoading(false); return }

      const schedType = data.schedule_type ?? 'daily'
      if (schedType === 'monthly') setSelectedDay(1)
      setSheet({
        ...data,
        scheduled_days: data.scheduled_days ?? [],
        schedule_type: schedType,
        exercises: (data.sheet_exercises ?? []).sort(
          (a: SheetExercise, b: SheetExercise) => a.order_index - b.order_index
        ),
      })
      setLoading(false)
    }
    load()
  }, [id, currentAcademy])

  async function handleScheduledDaysChange(days: number[]) {
    if (!sheet) return
    setSheet((prev) => prev ? { ...prev, scheduled_days: days } : prev)
    setSavingDays(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('workout_sheets')
      .update({ scheduled_days: days })
      .eq('id', sheet.id)
    setSavingDays(false)
    if (error) { toast.error('Erro ao salvar dias.'); return }
    toast.success('Dias atualizados.')
  }

  async function handleDeleteExercise(exerciseId: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('sheet_exercises').delete().eq('id', exerciseId)
    setSheet((prev) => prev ? {
      ...prev,
      exercises: prev.exercises.filter((e) => e.id !== exerciseId),
    } : prev)
    toast.success('Exercício removido.')
  }

  async function handleUpdateExercise(
    exerciseId: string,
    patch: Partial<Pick<SheetExercise, 'sets' | 'reps' | 'rest_seconds' | 'weight_suggestion' | 'notes'>>
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('sheet_exercises').update(patch).eq('id', exerciseId)
    if (error) { toast.error('Erro ao atualizar exercício.'); return }
    setSheet((prev) => prev ? {
      ...prev,
      exercises: prev.exercises.map((e) => e.id === exerciseId ? { ...e, ...patch } : e),
    } : prev)
    toast.success('Exercício atualizado.')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
      </div>
    )
  }

  if (notFound || !sheet) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 rounded-2xl bg-surface-200 flex items-center justify-center mb-4">
          <ClipboardList className="w-6 h-6 text-muted-foreground/40" />
        </div>
        <p className="font-semibold">Ficha não encontrada</p>
        <p className="text-sm text-muted-foreground mt-1">Esta ficha não existe ou você não tem acesso.</p>
        <Link href="/treinos" className="btn-secondary text-sm py-2 px-4 rounded-xl mt-4 inline-flex">
          Voltar para treinos
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show" className="flex items-start gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-surface-200 transition-all text-muted-foreground hover:text-foreground mt-0.5"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="section-title truncate">{sheet.name}</h2>
            {sheet.is_active && <span className="badge-success text-[10px]">Ativa</span>}
            {sheet.schedule_type !== 'daily' && (
              <span className="badge text-[10px]">{SCHEDULE_LABELS[sheet.schedule_type]}</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {sheet.goal && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Target className="w-3 h-3" /> {sheet.goal}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Dumbbell className="w-3 h-3" /> {sheet.exercises.length} exercícios
            </span>
          </div>
        </div>
      </motion.div>

      {/* Description */}
      {sheet.description && (
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show"
          className="glass rounded-2xl p-4 text-sm text-muted-foreground"
        >
          {sheet.description}
        </motion.div>
      )}

      {/* Actions */}
      <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show" className="flex gap-3">
        {!isPersonal && (
          <Link
            href={`/treinos/executar/${sheet.id}`}
            className="flex-1 btn-primary py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" /> Executar treino
          </Link>
        )}
        {currentRole === 'personal' && (
          <Link
            href={sheet.schedule_type === 'daily' ? `/exercicios?addTo=${sheet.id}` : `/exercicios?addTo=${sheet.id}&day=${selectedDay}&type=${sheet.schedule_type}`}
            className="flex-1 btn-secondary py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Adicionar exercício
          </Link>
        )}
      </motion.div>

      {/* Scheduled days — personal only, daily sheets only */}
      {isPersonal && sheet.schedule_type === 'daily' && (
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show" className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-brand-400" />
              <h3 className="font-display font-bold text-sm">Dias da semana</h3>
            </div>
            {savingDays && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Selecione os dias em que o aluno deve realizar este treino.
          </p>
          <DayPicker
            days={sheet.scheduled_days}
            onChange={handleScheduledDaysChange}
            saving={savingDays}
          />
          {sheet.scheduled_days.length === 0 && (
            <p className="text-[11px] text-muted-foreground/60 italic mt-3">
              Nenhum dia selecionado — este treino não aparecerá na agenda do aluno.
            </p>
          )}
        </motion.div>
      )}

      {/* Exercises */}
      <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show" className="glass rounded-2xl p-5">
        {/* Day tabs — weekly / monthly */}
        {sheet.schedule_type !== 'daily' && (
          <div className="mb-4">
            <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1">
              {(sheet.schedule_type === 'weekly' ? DAY_LABELS : WEEK_LABELS).map((label, i) => {
                const dayIdx = sheet.schedule_type === 'weekly' ? i : i + 1
                const count = sheet.exercises.filter((e) => e.day_index === dayIdx).length
                return (
                  <button
                    key={dayIdx}
                    onClick={() => setSelectedDay(dayIdx)}
                    className={cn(
                      'flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-xs font-bold transition-all min-w-[44px]',
                      selectedDay === dayIdx
                        ? 'bg-brand-500 text-white shadow-[0_0_12px_rgba(29,158,117,0.3)]'
                        : 'bg-surface-200 text-muted-foreground hover:text-foreground hover:bg-surface-300'
                    )}
                  >
                    <span>{label}</span>
                    {count > 0 && (
                      <span className={cn('text-[9px]', selectedDay === dayIdx ? 'opacity-80' : 'text-brand-400')}>
                        {count}x
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-sm">
            {sheet.schedule_type === 'daily'
              ? `Exercícios (${sheet.exercises.length})`
              : sheet.schedule_type === 'weekly'
                ? `${DAY_LABELS[selectedDay]} — ${sheet.exercises.filter((e) => e.day_index === selectedDay).length} exercícios`
                : `${WEEK_LABELS[selectedDay - 1]} — ${sheet.exercises.filter((e) => e.day_index === selectedDay).length} exercícios`
            }
          </h3>
        </div>

        {(() => {
          const displayed = sheet.schedule_type === 'daily'
            ? sheet.exercises
            : sheet.exercises.filter((e) => e.day_index === selectedDay)
          return displayed.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-surface-200 flex items-center justify-center mb-3">
                <Dumbbell className="w-5 h-5 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-semibold text-muted-foreground">Nenhum exercício ainda</p>
              {isPersonal && (
                <Link
                  href={sheet.schedule_type === 'daily' ? `/exercicios?addTo=${sheet.id}` : `/exercicios?addTo=${sheet.id}&day=${selectedDay}&type=${sheet.schedule_type}`}
                  className="btn-primary text-xs py-2 px-4 rounded-xl mt-3 inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar exercícios
                </Link>
              )}
            </div>
          ) : (
            <AnimatePresence>
              <div className="space-y-2">
                {displayed.map((ex) => (
                  <ExerciseRow
                    key={ex.id}
                    ex={ex}
                    isPersonal={isPersonal}
                    onDelete={handleDeleteExercise}
                    onUpdate={handleUpdateExercise}
                  />
                ))}
              </div>
            </AnimatePresence>
          )
        })()}
      </motion.div>
    </div>
  )
}
