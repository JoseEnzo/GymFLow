'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Dumbbell, Edit2, Trash2, Loader2, X, Globe, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { MUSCLE_GROUPS } from '@gymflow/database'

import { cn, MUSCLE_GROUP_COLORS } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { ExerciseAnimation, patternForMuscles, patternLabel } from '@/components/exercise/exercise-animation'

const DIFFICULTY_LABELS = { beginner: 'Iniciante', intermediate: 'Intermediário', advanced: 'Avançado' } as const
const DIFFICULTY_COLORS = { beginner: 'badge-success', intermediate: 'badge-warning', advanced: 'badge-danger' } as const

type Difficulty = 'beginner' | 'intermediate' | 'advanced'

interface Exercise {
  id: string
  name_pt: string
  muscle_groups: string[]
  equipment: string[]
  difficulty: Difficulty
  is_global: boolean
  created_by: string | null
  academy_id: string | null
  description: string | null
  instructions: string[] | null
}

interface EditForm {
  name_pt: string
  difficulty: Difficulty
  muscle_groups: string[]
  equipment: string
  description: string
}

function EditModal({ exercise, onClose, onSaved }: {
  exercise: Exercise
  onClose: () => void
  onSaved: (ex: Exercise) => void
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any
  const [form, setForm] = useState<EditForm>({
    name_pt: exercise.name_pt,
    difficulty: exercise.difficulty,
    muscle_groups: [...exercise.muscle_groups],
    equipment: exercise.equipment.join(', '),
    description: exercise.description ?? '',
  })
  const [saving, setSaving] = useState(false)

  function toggleMuscle(m: string) {
    setForm((f) => ({
      ...f,
      muscle_groups: f.muscle_groups.includes(m) ? f.muscle_groups.filter((x) => x !== m) : [...f.muscle_groups, m],
    }))
  }

  async function handleSave() {
    if (!form.name_pt.trim()) { toast.error('Nome obrigatório.'); return }
    if (form.muscle_groups.length === 0) { toast.error('Selecione ao menos um grupo muscular.'); return }

    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('exercises')
        .update({
          name: form.name_pt,
          name_pt: form.name_pt,
          muscle_groups: form.muscle_groups,
          equipment: form.equipment ? form.equipment.split(',').map((e) => e.trim()).filter(Boolean) : [],
          difficulty: form.difficulty,
          description: form.description || null,
        })
        .eq('id', exercise.id)
        .select('id, name_pt, muscle_groups, equipment, difficulty, is_global, created_by, academy_id, description, instructions')
        .single()

      if (error) throw error
      toast.success('Exercício atualizado!')
      onSaved(data as Exercise)
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Erro ao atualizar exercício.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
        className="glass w-full max-w-md rounded-2xl p-6 space-y-5 border border-border/60 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold">Editar exercício</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-200 transition-all text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nome <span className="text-red-400">*</span></label>
            <input
              value={form.name_pt}
              onChange={(e) => setForm((f) => ({ ...f, name_pt: e.target.value }))}
              className="field"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Dificuldade</label>
            <div className="grid grid-cols-3 gap-2">
              {(['beginner', 'intermediate', 'advanced'] as const).map((d) => (
                <button key={d} type="button" onClick={() => setForm((f) => ({ ...f, difficulty: d }))}
                  className={cn('py-2 rounded-xl border text-xs font-medium transition-all',
                    form.difficulty === d ? 'border-brand-500/50 bg-brand-500/10 text-brand-300' : 'border-border/60 text-muted-foreground hover:bg-surface-100'
                  )}>
                  {DIFFICULTY_LABELS[d]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Grupos musculares <span className="text-red-400">*</span></label>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
              {MUSCLE_GROUPS.map((m) => {
                const active = form.muscle_groups.includes(m)
                const color = MUSCLE_GROUP_COLORS[m] ?? '#6366F1'
                return (
                  <button key={m} type="button" onClick={() => toggleMuscle(m)}
                    className="px-2.5 py-1 rounded-full text-xs font-medium border transition-all"
                    style={active ? { background: color, borderColor: color, color: '#fff' } : { borderColor: 'hsl(var(--border) / 0.6)', color: 'hsl(var(--muted-foreground))' }}>
                    {m}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Equipamentos <span className="text-xs text-muted-foreground">(separe por vírgula)</span></label>
            <input
              value={form.equipment}
              onChange={(e) => setForm((f) => ({ ...f, equipment: e.target.value }))}
              placeholder="Ex: Haltere, Banco"
              className="field"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Descrição <span className="text-xs text-muted-foreground">(opcional)</span></label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Descreva a execução do exercício..."
              rows={3}
              className="field resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 btn-secondary py-2.5 rounded-xl text-sm">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 btn-primary py-2.5 rounded-xl text-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function ExercicioDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const { currentRole } = useAuthStore()

  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [showEdit, setShowEdit] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    async function load() {
      const [{ data: authData }, { data, error }] = await Promise.all([
        supabase.auth.getUser(),
        supabase
          .from('exercises')
          .select('id, name_pt, muscle_groups, equipment, difficulty, is_global, created_by, academy_id, description, instructions')
          .eq('id', id)
          .single(),
      ])

      setUserId(authData.user?.id ?? null)

      if (error || !data) {
        toast.error('Exercício não encontrado.')
        router.push('/exercicios')
        return
      }
      setExercise(data as Exercise)
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function handleDelete() {
    if (!exercise) return
    setDeleting(true)
    try {
      const { error } = await supabase.from('exercises').delete().eq('id', exercise.id)
      if (error) throw error
      toast.success('Exercício excluído.')
      router.push('/exercicios')
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Erro ao excluir exercício.')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
      </div>
    )
  }

  if (!exercise) return null

  const primaryMuscle = exercise.muscle_groups[0]
  const color = primaryMuscle ? (MUSCLE_GROUP_COLORS[primaryMuscle] ?? '#6366F1') : '#6366F1'
  const canEdit = !exercise.is_global && (exercise.created_by === userId || currentRole === 'owner')

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-2xl">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Biblioteca de exercícios
      </button>

      <div className="glass rounded-2xl p-6 border border-border/60 space-y-5">
        {/* Header do exercício */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${color}15`, border: `1px solid ${color}25` }}
            >
              <Dumbbell style={{ color, width: '1.5rem', height: '1.5rem' }} />
            </div>
            <div>
              <h1 className="text-xl font-bold font-display">{exercise.name_pt}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={cn(DIFFICULTY_COLORS[exercise.difficulty] ?? 'badge', 'text-xs')}>
                  {DIFFICULTY_LABELS[exercise.difficulty] ?? exercise.difficulty}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  {exercise.is_global
                    ? <><Globe className="w-3 h-3" /> Global</>
                    : <><Lock className="w-3 h-3" /> Da academia</>}
                </span>
              </div>
            </div>
          </div>

          {canEdit && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setShowEdit(true)}
                className="p-2 rounded-xl border border-border/60 hover:bg-surface-100 text-muted-foreground hover:text-foreground transition-all"
                title="Editar"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="p-2 rounded-xl border border-red-500/20 hover:bg-red-500/10 text-red-400 transition-all"
                title="Excluir"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Grupos musculares */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Grupos musculares</p>
          <div className="flex flex-wrap gap-1.5">
            {exercise.muscle_groups.map((m) => (
              <span
                key={m}
                className="px-3 py-1 rounded-full text-xs font-medium"
                style={{
                  background: `${MUSCLE_GROUP_COLORS[m] ?? '#6366F1'}15`,
                  color: MUSCLE_GROUP_COLORS[m] ?? '#6366F1',
                  border: `1px solid ${MUSCLE_GROUP_COLORS[m] ?? '#6366F1'}25`,
                }}
              >
                {m}
              </span>
            ))}
          </div>
        </div>

        {/* Equipamentos */}
        {exercise.equipment.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Equipamentos</p>
            <div className="flex flex-wrap gap-1.5">
              {exercise.equipment.map((e) => (
                <span key={e} className="px-3 py-1 rounded-full text-xs font-medium border border-border/60 text-muted-foreground">
                  {e}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Descrição */}
        {exercise.description && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Descrição</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{exercise.description}</p>
          </div>
        )}

        {/* Instruções */}
        {exercise.instructions && exercise.instructions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Execução</p>
            <ol className="space-y-2">
              {exercise.instructions.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="w-5 h-5 rounded-full bg-brand-500/15 text-brand-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-muted-foreground">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      {/* Demonstração — boneco animado (padrão de movimento por grupo muscular) */}
      <div className="glass rounded-2xl p-6 border border-border/60 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Demonstração</p>
          <span className="text-[11px] text-muted-foreground">{patternLabel(patternForMuscles(exercise.muscle_groups))}</span>
        </div>
        <div className="flex justify-center">
          <div
            className="w-44 h-56 rounded-2xl border border-border/40 flex items-center justify-center"
            style={{ background: `radial-gradient(circle at 50% 35%, ${color}1f, transparent 70%), hsl(var(--surface-100))` }}
          >
            <ExerciseAnimation muscleGroups={exercise.muscle_groups} className="w-32 h-48" />
          </div>
        </div>
        <p className="text-[11px] text-center text-muted-foreground/60">
          Animação ilustrativa do padrão de movimento — não substitui a orientação de um profissional.
        </p>
      </div>

      {/* Confirm delete */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="glass w-full max-w-sm rounded-2xl p-6 space-y-4 border border-red-500/20"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Excluir exercício</h3>
                  <p className="text-xs text-muted-foreground">Esta ação não pode ser desfeita.</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Tem certeza que deseja excluir <span className="font-semibold text-foreground">{exercise.name_pt}</span>?
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(false)} className="flex-1 btn-secondary py-2.5 rounded-xl text-sm">
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25 transition-all"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Excluir'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit modal */}
      <AnimatePresence>
        {showEdit && (
          <EditModal
            exercise={exercise}
            onClose={() => setShowEdit(false)}
            onSaved={(updated) => { setExercise(updated); setShowEdit(false) }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
