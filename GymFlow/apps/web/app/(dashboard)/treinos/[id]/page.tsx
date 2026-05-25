'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Dumbbell, Clock, Target, Users, Play,
  Plus, Trash2, ChevronRight, Loader2, Edit2, Check,
  ClipboardList,
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
  student?: { full_name: string | null } | null
  exercises: SheetExercise[]
}

function ExerciseRow({ ex, isPersonal, onDelete }: {
  ex: SheetExercise
  isPersonal: boolean
  onDelete: (id: string) => void
}) {
  const [confirming, setConfirming] = useState(false)

  function handleDeleteClick() {
    if (!confirming) {
      setConfirming(true)
      setTimeout(() => setConfirming(false), 3000)
    } else {
      onDelete(ex.id)
    }
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
        <button
          onClick={handleDeleteClick}
          title={confirming ? 'Clique novamente para confirmar' : 'Remover exercício'}
          className={cn(
            'p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 text-xs',
            confirming
              ? 'text-red-400 bg-red-500/10 opacity-100 font-semibold px-2'
              : 'text-muted-foreground/40 hover:text-red-400 hover:bg-red-500/10'
          )}
        >
          {confirming ? 'Confirmar?' : <Trash2 className="w-3.5 h-3.5" />}
        </button>
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

  useEffect(() => {
    async function load() {
      if (!currentAcademy) { setLoading(false); return }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('workout_sheets')
        .select(`
          id, name, goal, description, is_active, created_at,
          sheet_exercises (
            id, sets, reps, rest_seconds, weight_suggestion, notes, order_index,
            exercise:exercises ( id, name_pt, muscle_groups )
          )
        `)
        .eq('id', id)
        .eq('academy_id', currentAcademy.id)
        .single()

      if (error || !data) { setNotFound(true); setLoading(false); return }

      setSheet({
        ...data,
        exercises: (data.sheet_exercises ?? []).sort(
          (a: SheetExercise, b: SheetExercise) => a.order_index - b.order_index
        ),
      })
      setLoading(false)
    }
    load()
  }, [id, currentAcademy])

  async function handleDeleteExercise(exerciseId: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('sheet_exercises').delete().eq('id', exerciseId)
    setSheet((prev) => prev ? {
      ...prev,
      exercises: prev.exercises.filter((e) => e.id !== exerciseId),
    } : prev)
    toast.success('Exercício removido.')
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
        <Link
          href={`/treinos/executar/${sheet.id}`}
          className="flex-1 btn-primary py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4" /> Executar treino
        </Link>
        {isPersonal && (
          <Link
            href={`/exercicios?addTo=${sheet.id}`}
            className="flex-1 btn-secondary py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Adicionar exercício
          </Link>
        )}
      </motion.div>

      {/* Exercises */}
      <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show" className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-sm">
            Exercícios ({sheet.exercises.length})
          </h3>
        </div>

        {sheet.exercises.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-surface-200 flex items-center justify-center mb-3">
              <Dumbbell className="w-5 h-5 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-semibold text-muted-foreground">Nenhum exercício ainda</p>
            {isPersonal && (
              <Link
                href={`/exercicios?addTo=${sheet.id}`}
                className="btn-primary text-xs py-2 px-4 rounded-xl mt-3 inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar exercícios
              </Link>
            )}
          </div>
        ) : (
          <AnimatePresence>
            <div className="space-y-2">
              {sheet.exercises.map((ex) => (
                <ExerciseRow
                  key={ex.id}
                  ex={ex}
                  isPersonal={isPersonal}
                  onDelete={handleDeleteExercise}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </motion.div>
    </div>
  )
}
