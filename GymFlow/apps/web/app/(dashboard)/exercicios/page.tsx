'use client'

import { useState, useEffect, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Search, Plus, ChevronRight, Dumbbell, X, Loader2, Check, ArrowLeft,
  BookOpen, ClipboardList, UserPlus, ChevronLeft, Users, Eye, Edit2,
} from 'lucide-react'
import { toast } from 'sonner'
import { MUSCLE_GROUPS } from '@gymflow/database'

import { cn, MUSCLE_GROUP_COLORS } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } }
const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
}

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
}

interface ExerciseForm {
  name_pt: string
  difficulty: Difficulty
  muscle_groups: string[]
  equipment: string
}

interface WorkoutSheet {
  id: string
  name: string
  goal: string | null
  student_id: string | null
  personal_id: string | null
}

interface StudentInfo {
  user_id: string
  full_name: string
  avatar_url: string | null
}

// ─────────────────────────────────────────────────────────────
// ExerciseOptionsSheet — bottom sheet with multi-step actions
// ─────────────────────────────────────────────────────────────
type OptionsView = 'menu' | 'my-sheets' | 'students' | 'student-sheets' | 'configure'

function ExerciseOptionsSheet({
  exercise,
  isPersonal,
  currentAcademy,
  userId,
  onClose,
}: {
  exercise: Exercise
  isPersonal: boolean
  currentAcademy: { id: string } | null
  userId: string | null
  onClose: () => void
}) {
  const router = useRouter()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any

  const [view, setView] = useState<OptionsView>('menu')
  const [sheets, setSheets] = useState<WorkoutSheet[]>([])
  const [students, setStudents] = useState<StudentInfo[]>([])
  const [pickedStudent, setPickedStudent] = useState<StudentInfo | null>(null)
  const [pickedSheet, setPickedSheet] = useState<WorkoutSheet | null>(null)
  const [loading, setLoading] = useState(false)
  const [sets, setSets] = useState(3)
  const [reps, setReps] = useState('12')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const primaryMuscle = exercise.muscle_groups[0]
  const color = primaryMuscle ? (MUSCLE_GROUP_COLORS[primaryMuscle] ?? '#6366F1') : '#6366F1'

  // ── Load my sheets (for "Adicionar à ficha")
  async function loadMySheets() {
    if (!currentAcademy) return
    setLoading(true)
    try {
      let q = supabase
        .from('workout_sheets')
        .select('id, name, goal, student_id, personal_id')
        .eq('academy_id', currentAcademy.id)
        .order('name')
      if (userId) q = q.eq('personal_id', userId)
      const { data, error } = await q
      if (error) throw error
      setSheets((data ?? []) as WorkoutSheet[])
      setView('my-sheets')
    } catch {
      toast.error('Erro ao carregar fichas.')
    } finally {
      setLoading(false)
    }
  }

  // ── Load students (for "Atribuir a aluno")
  async function loadStudents() {
    if (!currentAcademy) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('academy_members')
        .select('user_id, profiles(full_name, avatar_url)')
        .eq('academy_id', currentAcademy.id)
        .eq('role', 'student')
        .order('user_id')
      if (error) throw error
      const list: StudentInfo[] = (data ?? []).map((m: { user_id: string; profiles: { full_name: string; avatar_url: string | null } | null }) => ({
        user_id: m.user_id,
        full_name: m.profiles?.full_name ?? 'Aluno sem nome',
        avatar_url: m.profiles?.avatar_url ?? null,
      }))
      setStudents(list)
      setView('students')
    } catch {
      toast.error('Erro ao carregar alunos.')
    } finally {
      setLoading(false)
    }
  }

  // ── Load sheets for a specific student
  async function loadStudentSheets(student: StudentInfo) {
    if (!currentAcademy) return
    setPickedStudent(student)
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('workout_sheets')
        .select('id, name, goal, student_id, personal_id')
        .eq('academy_id', currentAcademy.id)
        .eq('student_id', student.user_id)
        .order('name')
      if (error) throw error
      setSheets((data ?? []) as WorkoutSheet[])
      setView('student-sheets')
    } catch {
      toast.error('Erro ao carregar fichas do aluno.')
    } finally {
      setLoading(false)
    }
  }

  // ── Pick a sheet and move to configure step
  function selectSheet(sheet: WorkoutSheet) {
    setPickedSheet(sheet)
    setView('configure')
  }

  // ── Confirm: add exercise to the picked sheet
  async function handleConfirm() {
    if (!pickedSheet) return
    setSaving(true)
    try {
      const { count } = await supabase
        .from('sheet_exercises')
        .select('id', { count: 'exact', head: true })
        .eq('sheet_id', pickedSheet.id)

      const { error } = await supabase
        .from('sheet_exercises')
        .insert({
          sheet_id: pickedSheet.id,
          exercise_id: exercise.id,
          order_index: count ?? 0,
          sets,
          reps: reps.trim() || '12',
          rest_seconds: 60,
          notes: notes.trim() || null,
        })

      if (error) throw error
      toast.success(`Exercício adicionado à ficha "${pickedSheet.name}"!`)
      onClose()
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Erro ao adicionar exercício.')
    } finally {
      setSaving(false)
    }
  }

  // ── Back button label per view
  const backLabel: Partial<Record<OptionsView, string>> = {
    'my-sheets': 'Opções',
    students: 'Opções',
    'student-sheets': 'Alunos',
    configure: pickedStudent ? 'Fichas do aluno' : 'Fichas',
  }

  function handleBack() {
    if (view === 'my-sheets' || view === 'students') setView('menu')
    else if (view === 'student-sheets') setView('students')
    else if (view === 'configure') {
      setPickedSheet(null)
      setView(pickedStudent ? 'student-sheets' : 'my-sheets')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="glass w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-border/60 border-b-0 sm:border-b overflow-hidden"
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-border/60" />
        </div>

        {/* Exercise header */}
        <div className="px-5 pt-3 pb-4 border-b border-border/40 flex items-center gap-3">
          {view !== 'menu' && (
            <button onClick={handleBack} className="p-1.5 rounded-lg hover:bg-surface-200 transition-all text-muted-foreground hover:text-foreground mr-1">
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${color}18`, border: `1px solid ${color}28` }}>
            <Dumbbell style={{ color, width: '1rem', height: '1rem' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm leading-tight truncate">{exercise.name_pt}</p>
            <p className="text-[11px] text-muted-foreground">
              {view === 'menu' && exercise.muscle_groups.join(' · ')}
              {view === 'my-sheets' && 'Escolha uma ficha'}
              {view === 'students' && 'Escolha um aluno'}
              {view === 'student-sheets' && (pickedStudent ? `Fichas de ${pickedStudent.full_name}` : 'Fichas do aluno')}
              {view === 'configure' && `Ficha: ${pickedSheet?.name}`}
            </p>
          </div>
          {view === 'menu' && (
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-200 transition-all text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto">

          {/* ── MENU ── */}
          {view === 'menu' && (
            <div className="p-4 space-y-2">
              <button
                onClick={() => router.push(`/exercicios/${exercise.id}`)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-100 border border-transparent hover:border-border/40 transition-all text-left group"
              >
                <div className="w-9 h-9 rounded-xl bg-surface-200 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-500/10 transition-colors">
                  <Eye className="w-4 h-4 text-muted-foreground group-hover:text-brand-400 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">Ver detalhes</p>
                  <p className="text-[11px] text-muted-foreground">Descrição, equipamentos e instruções</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
              </button>

              {isPersonal && (
                <>
                  <button
                    onClick={loadMySheets}
                    disabled={loading}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-100 border border-transparent hover:border-border/40 transition-all text-left group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                      <ClipboardList className="w-4 h-4 text-brand-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">Adicionar a uma ficha</p>
                      <p className="text-[11px] text-muted-foreground">Escolha uma ficha de treino existente</p>
                    </div>
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />}
                  </button>

                  <button
                    onClick={loadStudents}
                    disabled={loading}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-100 border border-transparent hover:border-border/40 transition-all text-left group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <UserPlus className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">Atribuir a um aluno</p>
                      <p className="text-[11px] text-muted-foreground">Selecione o aluno e a ficha de destino</p>
                    </div>
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />}
                  </button>

                  <button
                    onClick={() => router.push(`/treinos?exercise=${exercise.id}`)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-100 border border-transparent hover:border-border/40 transition-all text-left group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">Criar nova ficha</p>
                      <p className="text-[11px] text-muted-foreground">Monte uma ficha com este exercício</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                  </button>
                </>
              )}

              {!exercise.is_global && (
                <button
                  onClick={() => router.push(`/exercicios/${exercise.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-100 border border-transparent hover:border-border/40 transition-all text-left group"
                >
                  <div className="w-9 h-9 rounded-xl bg-surface-200 flex items-center justify-center flex-shrink-0">
                    <Edit2 className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">Editar exercício</p>
                    <p className="text-[11px] text-muted-foreground">Alterar nome, músculos ou equipamentos</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                </button>
              )}

              {/* Muscle tags */}
              <div className="pt-2 pb-1 flex flex-wrap gap-1.5 px-1">
                {exercise.muscle_groups.map((m) => (
                  <span key={m} className="px-2.5 py-1 rounded-full text-[10px] font-medium"
                    style={{ background: `${MUSCLE_GROUP_COLORS[m] ?? '#6366F1'}12`, color: MUSCLE_GROUP_COLORS[m] ?? '#6366F1' }}>
                    {m}
                  </span>
                ))}
                <span className={cn(DIFFICULTY_COLORS[exercise.difficulty], 'text-[10px]')}>
                  {DIFFICULTY_LABELS[exercise.difficulty]}
                </span>
              </div>
            </div>
          )}

          {/* ── MY SHEETS LIST ── */}
          {view === 'my-sheets' && (
            <div className="p-4 space-y-2">
              {loading && (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-brand-400" />
                </div>
              )}
              {!loading && sheets.length === 0 && (
                <div className="text-center py-10">
                  <ClipboardList className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhuma ficha encontrada</p>
                  <button
                    onClick={() => router.push('/treinos')}
                    className="text-xs text-brand-400 mt-1 hover:underline"
                  >
                    Criar uma ficha
                  </button>
                </div>
              )}
              {!loading && sheets.map((sheet) => (
                <button key={sheet.id}
                  onClick={() => selectSheet(sheet)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-100 border border-transparent hover:border-border/40 transition-all text-left group"
                >
                  <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                    <ClipboardList className="w-3.5 h-3.5 text-brand-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{sheet.name}</p>
                    {sheet.goal && <p className="text-[11px] text-muted-foreground truncate">{sheet.goal}</p>}
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                </button>
              ))}
            </div>
          )}

          {/* ── STUDENTS LIST ── */}
          {view === 'students' && (
            <div className="p-4 space-y-2">
              {loading && (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-brand-400" />
                </div>
              )}
              {!loading && students.length === 0 && (
                <div className="text-center py-10">
                  <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhum aluno encontrado</p>
                  <button
                    onClick={() => router.push('/alunos')}
                    className="text-xs text-brand-400 mt-1 hover:underline"
                  >
                    Gerenciar alunos
                  </button>
                </div>
              )}
              {!loading && students.map((student) => (
                <button key={student.user_id}
                  onClick={() => loadStudentSheets(student)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-100 border border-transparent hover:border-border/40 transition-all text-left group"
                >
                  <div className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center flex-shrink-0 text-sm font-bold text-amber-400">
                    {student.full_name.charAt(0).toUpperCase()}
                  </div>
                  <p className="flex-1 text-sm font-semibold truncate">{student.full_name}</p>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                </button>
              ))}
            </div>
          )}

          {/* ── STUDENT SHEETS ── */}
          {view === 'student-sheets' && (
            <div className="p-4 space-y-2">
              {loading && (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-brand-400" />
                </div>
              )}
              {!loading && sheets.length === 0 && (
                <div className="text-center py-10">
                  <ClipboardList className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {pickedStudent?.full_name} não tem fichas ainda
                  </p>
                  <button
                    onClick={() => router.push('/treinos')}
                    className="text-xs text-brand-400 mt-1 hover:underline"
                  >
                    Criar ficha para este aluno
                  </button>
                </div>
              )}
              {!loading && sheets.map((sheet) => (
                <button key={sheet.id}
                  onClick={() => selectSheet(sheet)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-100 border border-transparent hover:border-border/40 transition-all text-left group"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <ClipboardList className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{sheet.name}</p>
                    {sheet.goal && <p className="text-[11px] text-muted-foreground truncate">{sheet.goal}</p>}
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                </button>
              ))}
            </div>
          )}

          {/* ── CONFIGURE (sets / reps / notes) ── */}
          {view === 'configure' && pickedSheet && (
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Séries</label>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setSets((s) => Math.max(1, s - 1))}
                      className="w-8 h-8 rounded-lg border border-border/60 flex items-center justify-center text-sm font-bold hover:bg-surface-100 transition-all">−</button>
                    <span className="flex-1 text-center font-bold text-lg">{sets}</span>
                    <button onClick={() => setSets((s) => Math.min(20, s + 1))}
                      className="w-8 h-8 rounded-lg border border-border/60 flex items-center justify-center text-sm font-bold hover:bg-surface-100 transition-all">+</button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Repetições</label>
                  <input
                    value={reps}
                    onChange={(e) => setReps(e.target.value)}
                    placeholder="Ex: 12 ou 8-12"
                    className="field text-center text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Comentário <span className="normal-case text-[10px]">(opcional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Foco na contração, não trancar os joelhos..."
                  rows={2}
                  className="field text-sm resize-none"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={handleBack} className="flex-1 btn-secondary py-2.5 rounded-xl text-sm">Voltar</button>
                <button
                  onClick={handleConfirm}
                  disabled={saving}
                  className="flex-1 btn-primary py-2.5 rounded-xl text-sm"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Adicionar'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Safe area padding for mobile */}
        <div className="h-safe-bottom sm:hidden" />
      </motion.div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────
// NewExerciseModal
// ─────────────────────────────────────────────────────────────
function NewExerciseModal({ onClose, onCreated }: { onClose: () => void; onCreated: (ex: Exercise) => void }) {
  const { currentAcademy } = useAuthStore()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any
  const [form, setForm] = useState<ExerciseForm>({ name_pt: '', difficulty: 'beginner', muscle_groups: [], equipment: '' })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!form.name_pt.trim()) { toast.error('Nome obrigatório.'); return }
    if (form.muscle_groups.length === 0) { toast.error('Selecione ao menos um grupo muscular.'); return }
    if (!currentAcademy) { toast.error('Nenhuma academia selecionada.'); return }

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('exercises')
        .insert({
          name: form.name_pt,
          name_pt: form.name_pt,
          muscle_groups: form.muscle_groups,
          equipment: form.equipment ? form.equipment.split(',').map((e: string) => e.trim()).filter(Boolean) : [],
          difficulty: form.difficulty,
          is_global: false,
          academy_id: currentAcademy.id,
          created_by: user?.id,
        })
        .select('id, name_pt, muscle_groups, equipment, difficulty, is_global, created_by, academy_id')
        .single()

      if (error) throw error
      toast.success('Exercício criado!')
      onCreated(data as Exercise)
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Erro ao criar exercício.')
    } finally {
      setSaving(false)
    }
  }

  function toggleMuscle(m: string) {
    setForm((f) => ({
      ...f,
      muscle_groups: f.muscle_groups.includes(m) ? f.muscle_groups.filter((x) => x !== m) : [...f.muscle_groups, m],
    }))
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
          <h3 className="font-display font-bold">Novo exercício</h3>
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
              placeholder="Ex: Rosca concentrada com haltere"
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
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
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
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 btn-secondary py-2.5 rounded-xl text-sm">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 btn-primary py-2.5 rounded-xl text-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar exercício'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────
// AddToSheetModal (used in addTo mode)
// ─────────────────────────────────────────────────────────────
interface AddToSheetConfig { sets: number; reps: string; notes: string }

function AddToSheetModal({
  exercise,
  onClose,
  onConfirm,
  saving,
}: {
  exercise: Exercise
  onClose: () => void
  onConfirm: (cfg: AddToSheetConfig) => void
  saving: boolean
}) {
  const [sets, setSets] = useState(3)
  const [reps, setReps] = useState('12')
  const [notes, setNotes] = useState('')

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
        className="glass w-full max-w-sm rounded-2xl p-6 space-y-5 border border-border/60"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-sm">Adicionar exercício</h3>
            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[220px]">{exercise.name_pt}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-200 transition-all text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Séries</label>
            <div className="flex items-center gap-2">
              <button onClick={() => setSets((s) => Math.max(1, s - 1))}
                className="w-8 h-8 rounded-lg border border-border/60 flex items-center justify-center text-sm font-bold hover:bg-surface-100 transition-all">−</button>
              <span className="flex-1 text-center font-bold text-lg">{sets}</span>
              <button onClick={() => setSets((s) => Math.min(20, s + 1))}
                className="w-8 h-8 rounded-lg border border-border/60 flex items-center justify-center text-sm font-bold hover:bg-surface-100 transition-all">+</button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Repetições</label>
            <input
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              placeholder="Ex: 12 ou 8-12"
              className="field text-center text-sm"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Comentário <span className="normal-case text-[10px]">(opcional)</span></label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Foco na contração, não trancar os joelhos..."
            rows={2}
            className="field text-sm resize-none"
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 btn-secondary py-2.5 rounded-xl text-sm">Cancelar</button>
          <button
            onClick={() => onConfirm({ sets, reps: reps.trim() || '12', notes })}
            disabled={saving}
            className="flex-1 btn-primary py-2.5 rounded-xl text-sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Adicionar'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main page content
// ─────────────────────────────────────────────────────────────
function ExerciciosContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const addTo = searchParams.get('addTo')
  const { currentAcademy, currentRole, profile } = useAuthStore()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any
  const isPersonal = currentRole === 'owner' || currentRole === 'personal'

  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [showModal, setShowModal] = useState(false)
  const [adding, setAdding] = useState<string | null>(null)
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())
  const [sheetName, setSheetName] = useState('')
  const [pendingExercise, setPendingExercise] = useState<Exercise | null>(null)
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)

  const userId = profile?.id ?? null

  useEffect(() => {
    async function load() {
      let query = supabase
        .from('exercises')
        .select('id, name_pt, muscle_groups, equipment, difficulty, is_global, created_by, academy_id')
        .order('name_pt')

      if (currentAcademy) {
        query = query.or(`is_global.eq.true,academy_id.eq.${currentAcademy.id}`)
      } else {
        query = query.eq('is_global', true)
      }

      const { data, error } = await query
      if (error) { toast.error('Erro ao carregar exercícios.'); setLoading(false); return }
      setExercises((data ?? []) as Exercise[])
      setLoading(false)
    }
    load()

    if (addTo) {
      supabase.from('workout_sheets').select('name').eq('id', addTo).single()
        .then(({ data }: { data: { name: string } | null }) => { if (data) setSheetName(data.name) })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAcademy, addTo])

  async function handleAddToSheet(exerciseId: string, cfg: AddToSheetConfig) {
    if (!addTo || addedIds.has(exerciseId)) return
    setAdding(exerciseId)
    try {
      const { count } = await supabase
        .from('sheet_exercises')
        .select('id', { count: 'exact', head: true })
        .eq('sheet_id', addTo)

      const { error } = await supabase
        .from('sheet_exercises')
        .insert({
          sheet_id: addTo,
          exercise_id: exerciseId,
          order_index: count ?? 0,
          sets: cfg.sets,
          reps: cfg.reps,
          rest_seconds: 60,
          notes: cfg.notes || null,
        })

      if (error) throw error
      setAddedIds((prev) => new Set([...prev, exerciseId]))
      setPendingExercise(null)
      toast.success('Exercício adicionado à ficha!')
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Erro ao adicionar exercício.')
    } finally {
      setAdding(null)
    }
  }

  const filtered = exercises.filter((ex) => {
    const matchSearch = ex.name_pt.toLowerCase().includes(search.toLowerCase()) ||
      ex.muscle_groups.some((m) => m.toLowerCase().includes(search.toLowerCase()))
    const matchMuscle = !selectedMuscle || ex.muscle_groups.includes(selectedMuscle)
    const matchDifficulty = !selectedDifficulty || ex.difficulty === selectedDifficulty
    return matchSearch && matchMuscle && matchDifficulty
  })

  const hasActiveFilter = search || selectedMuscle || selectedDifficulty

  function handleCardClick(ex: Exercise) {
    if (addTo) return
    setSelectedExercise(ex)
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      {/* addTo banner */}
      {addTo && (
        <motion.div variants={fadeUp} className="glass rounded-2xl p-4 border border-brand-500/20 bg-brand-500/5 flex items-center gap-3">
          <button onClick={() => router.push(`/treinos/${addTo}`)} className="p-1.5 rounded-lg hover:bg-brand-500/15 transition-all text-brand-400">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-brand-300">Modo: adicionar à ficha</p>
            <p className="text-xs text-muted-foreground truncate">{sheetName || 'Carregando...'}</p>
          </div>
          {addedIds.size > 0 && (
            <span className="badge-success text-[10px]">{addedIds.size} adicionado{addedIds.size > 1 ? 's' : ''}</span>
          )}
          <button onClick={() => router.push(`/treinos/${addTo}`)} className="btn-primary text-xs py-2 px-4 rounded-xl">
            Concluir
          </button>
        </motion.div>
      )}

      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h2 className="section-title">Biblioteca de Exercícios</h2>
          <p className="section-subtitle mt-1">
            {loading ? 'Carregando...' : `${exercises.length} exercícios disponíveis`}
          </p>
        </div>
        {isPersonal && !addTo && (
          <button onClick={() => setShowModal(true)} className="btn-primary text-sm py-2.5 px-5 rounded-xl">
            <Plus className="w-4 h-4" /> Novo exercício
          </button>
        )}
      </motion.div>

      {/* Filtros */}
      <motion.div variants={fadeUp} className="space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar exercícios, músculos..."
              className="field pl-10"
            />
          </div>
          <div className="flex gap-2">
            {(['grid', 'list'] as const).map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={cn('px-3 py-2 rounded-xl border text-sm transition-all',
                  view === v ? 'border-brand-500/40 bg-brand-500/10 text-brand-300' : 'border-border/60 text-muted-foreground hover:bg-surface-100'
                )}>
                {v === 'grid' ? '⊞' : '≡'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedMuscle(null)}
            className={cn('px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap flex-shrink-0',
              !selectedMuscle ? 'bg-brand-500/15 text-brand-300 border-brand-500/30' : 'border-border/60 text-muted-foreground hover:border-border'
            )}>
            Todos
          </button>
          {MUSCLE_GROUPS.map((m) => {
            const color = MUSCLE_GROUP_COLORS[m] ?? '#6366F1'
            const active = selectedMuscle === m
            return (
              <button key={m} onClick={() => setSelectedMuscle(active ? null : m)}
                className={cn('px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap flex-shrink-0',
                  active ? 'text-white' : 'text-muted-foreground hover:text-foreground'
                )}
                style={active ? { background: color, borderColor: color } : { borderColor: 'hsl(var(--border) / 0.6)' }}>
                {m}
              </button>
            )
          })}
        </div>

        <div className="flex gap-2 flex-wrap">
          {([null, 'beginner', 'intermediate', 'advanced'] as const).map((d) => (
            <button key={d ?? 'all'} onClick={() => setSelectedDifficulty(d)}
              className={cn('px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                selectedDifficulty === d ? 'bg-brand-500/15 text-brand-300 border-brand-500/30' : 'border-border/60 text-muted-foreground hover:border-border'
              )}>
              {d === null ? 'Qualquer nível' : DIFFICULTY_LABELS[d]}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="text-xs text-muted-foreground">
        {loading ? 'Carregando...' : `${filtered.length} exercício${filtered.length !== 1 ? 's' : ''} encontrado${filtered.length !== 1 ? 's' : ''}`}
      </motion.div>

      {loading && (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
        </div>
      )}

      {/* Grid view */}
      {!loading && view === 'grid' && (
        <motion.div variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((ex) => {
            const primaryMuscle = ex.muscle_groups[0]
            const color = primaryMuscle ? (MUSCLE_GROUP_COLORS[primaryMuscle] ?? '#6366F1') : '#6366F1'
            const isAdded = addedIds.has(ex.id)
            const isAddingThis = adding === ex.id
            return (
              <motion.div key={ex.id} variants={fadeUp}>
                <div
                  onClick={() => addTo ? undefined : handleCardClick(ex)}
                  className={cn(
                    'glass rounded-2xl p-4 group hover:border-brand-500/20 hover:-translate-y-0.5 transition-all duration-300 hover:shadow-card-hover',
                    !addTo && 'cursor-pointer',
                    isAdded && 'border-emerald-500/20 bg-emerald-500/3'
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                      style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                      <Dumbbell style={{ color, width: '1.125rem', height: '1.125rem' }} />
                    </div>
                    <span className={cn(DIFFICULTY_COLORS[ex.difficulty] ?? 'badge', 'text-[10px]')}>
                      {DIFFICULTY_LABELS[ex.difficulty] ?? ex.difficulty}
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm leading-snug mb-2">{ex.name_pt}</h3>
                  <div className="flex flex-wrap gap-1">
                    {ex.muscle_groups.map((m) => (
                      <span key={m} className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                        style={{ background: `${MUSCLE_GROUP_COLORS[m] ?? '#6366F1'}12`, color: MUSCLE_GROUP_COLORS[m] ?? '#6366F1' }}>
                        {m}
                      </span>
                    ))}
                  </div>
                  {addTo && (
                    <button
                      onClick={(e) => { e.stopPropagation(); if (!isAdded) setPendingExercise(ex) }}
                      disabled={isAdded || isAddingThis}
                      className={cn(
                        'w-full mt-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5',
                        isAdded
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 cursor-default'
                          : 'bg-brand-500/15 text-brand-400 border border-brand-500/20 hover:bg-brand-500/25'
                      )}
                    >
                      {isAddingThis
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : isAdded
                          ? <><Check className="w-3.5 h-3.5" /> Adicionado</>
                          : <><Plus className="w-3.5 h-3.5" /> Adicionar</>}
                    </button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* List view */}
      {!loading && view === 'list' && (
        <motion.div variants={stagger} className="space-y-1.5">
          {filtered.map((ex) => {
            const primaryMuscle = ex.muscle_groups[0]
            const color = primaryMuscle ? (MUSCLE_GROUP_COLORS[primaryMuscle] ?? '#6366F1') : '#6366F1'
            const isAdded = addedIds.has(ex.id)
            const isAddingThis = adding === ex.id
            return (
              <motion.div key={ex.id} variants={fadeUp}>
                <div
                  onClick={() => addTo ? undefined : handleCardClick(ex)}
                  className={cn(
                    'glass rounded-xl px-4 py-3 flex items-center gap-4 hover:border-brand-500/20 transition-all group',
                    !addTo && 'cursor-pointer'
                  )}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                    <Dumbbell className="w-3.5 h-3.5" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{ex.name_pt}</p>
                    <p className="text-xs text-muted-foreground">{ex.muscle_groups.join(' · ')}</p>
                  </div>
                  <span className={cn(DIFFICULTY_COLORS[ex.difficulty] ?? 'badge', 'text-[10px] hidden sm:inline-flex')}>
                    {DIFFICULTY_LABELS[ex.difficulty] ?? ex.difficulty}
                  </span>
                  {addTo ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); if (!isAdded) setPendingExercise(ex) }}
                      disabled={isAdded || isAddingThis}
                      className={cn('p-2 rounded-lg transition-all',
                        isAdded ? 'text-emerald-400 bg-emerald-500/10 cursor-default' : 'text-brand-400 hover:bg-brand-500/15'
                      )}
                    >
                      {isAddingThis ? <Loader2 className="w-4 h-4 animate-spin" /> : isAdded ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </button>
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors flex-shrink-0" />
                  )}
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <motion.div variants={fadeUp} className="text-center py-20">
          <div className="w-14 h-14 rounded-2xl bg-surface-200 flex items-center justify-center mx-auto mb-4">
            <Dumbbell className="w-7 h-7 text-muted-foreground/40" />
          </div>
          <p className="font-semibold text-muted-foreground">Nenhum exercício encontrado</p>
          {hasActiveFilter && (
            <button
              onClick={() => { setSearch(''); setSelectedMuscle(null); setSelectedDifficulty(null) }}
              className="text-sm text-brand-400 mt-2 hover:underline"
            >
              Limpar filtros
            </button>
          )}
        </motion.div>
      )}

      <AnimatePresence>
        {showModal && (
          <NewExerciseModal
            onClose={() => setShowModal(false)}
            onCreated={(ex) => { setExercises((prev) => [ex, ...prev]); setShowModal(false) }}
          />
        )}
        {pendingExercise && (
          <AddToSheetModal
            exercise={pendingExercise}
            saving={adding === pendingExercise.id}
            onClose={() => setPendingExercise(null)}
            onConfirm={(cfg) => handleAddToSheet(pendingExercise.id, cfg)}
          />
        )}
        {selectedExercise && (
          <ExerciseOptionsSheet
            key={selectedExercise.id}
            exercise={selectedExercise}
            isPersonal={isPersonal}
            currentAcademy={currentAcademy}
            userId={userId}
            onClose={() => setSelectedExercise(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function ExerciciosPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-brand-400" /></div>}>
      <ExerciciosContent />
    </Suspense>
  )
}
