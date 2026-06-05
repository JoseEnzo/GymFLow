'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import {
  ArrowLeft, Loader2, Target, FileText,
  ChevronRight, Check, User, CalendarDays, Sparkles, X,
  Users, UserPlus,
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

const SCHEDULE_TYPES = [
  { id: 'daily',   emoji: '📅', label: 'Diária',   desc: 'Um único treino repetido nos dias escolhidos' },
  { id: 'weekly',  emoji: '📆', label: 'Semanal',  desc: 'Treinos diferentes para cada dia da semana' },
  { id: 'monthly', emoji: '🗓️', label: 'Mensal',   desc: 'Programação dividida em 4 semanas' },
]

const GOALS = [
  { id: 'Hipertrofia', emoji: '💪' },
  { id: 'Força', emoji: '🏋️' },
  { id: 'Condicionamento', emoji: '🏃' },
  { id: 'Perda de peso', emoji: '🔥' },
  { id: 'Reabilitação', emoji: '🩺' },
  { id: 'Flexibilidade', emoji: '🧘' },
]

type FormData = {
  name: string
  goal: string
  description: string
}

interface StudentOption {
  id: string
  full_name: string | null
}

interface SheetTemplate {
  id: string
  name: string
  muscle_group: string
  level: string
  goal: string | null
  exercise_count?: number
}

const MUSCLE_GROUPS_ORDER = [
  'Peito','Costas','Ombros','Bíceps','Tríceps','Antebraços',
  'Abdômen','Oblíquos','Glúteos','Quadríceps','Isquiotibiais',
  'Panturrilhas','Trapézio','Lombar','Cardio',
]
const LEVEL_ORDER = ['Iniciante','Intermediário','Avançado']
const LEVEL_COLORS: Record<string, string> = {
  'Iniciante':     '#10B981',
  'Intermediário': '#6366F1',
  'Avançado':      '#F97316',
}

function NovaFichaContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const studentIdFromUrl = searchParams.get('studentId')
  const { currentAcademy } = useAuthStore()
  const supabase = createClient()

  const [saving, setSaving] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState('')
  const [scheduleType, setScheduleType] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [templates, setTemplates] = useState<SheetTemplate[]>([])
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<SheetTemplate | null>(null)
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)
  const [students, setStudents] = useState<StudentOption[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState(studentIdFromUrl ?? '')
  const [loadingStudents, setLoadingStudents] = useState(!studentIdFromUrl)

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: { name: '', goal: '', description: '' },
  })

  // Load templates once
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(supabase as any)
      .from('workout_sheet_templates')
      .select('id, name, muscle_group, level, goal')
      .then(({ data }: { data: SheetTemplate[] | null }) => {
        if (data) setTemplates(data)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function applyTemplate(t: SheetTemplate) {
    setSelectedTemplate(t)
    setValue('name', t.name)
    if (t.goal) setSelectedGoal(t.goal)
    setShowTemplatePicker(false)
    setSelectedMuscleGroup(null)
  }

  useEffect(() => {
    if (studentIdFromUrl || !currentAcademy) {
      setLoadingStudents(false)
      return
    }

    async function fetchStudents() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: members } = await (supabase as any)
        .from('academy_members')
        .select('user_id')
        .eq('academy_id', currentAcademy!.id)
        .eq('role', 'student')
        .eq('is_active', true)

      const userIds: string[] = (members ?? []).map((m: { user_id: string }) => m.user_id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profilesData } = userIds.length > 0
        ? await (supabase as any).from('profiles').select('id, full_name').in('id', userIds)
        : { data: [] }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const profileMap: Record<string, string | null> = {}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(profilesData ?? []).forEach((p: any) => { profileMap[p.id] = p.full_name ?? null })

      const list: StudentOption[] = userIds.map((id) => ({ id, full_name: profileMap[id] ?? null }))
      setStudents(list)
      setLoadingStudents(false)
    }

    fetchStudents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAcademy, studentIdFromUrl])

  async function onSubmit(data: FormData) {
    if (!currentAcademy) {
      toast.error('Você precisa estar em uma academia para criar fichas.')
      return
    }
    if (!studentIdFromUrl && students.length > 0 && !selectedStudentId) {
      toast.error('Selecione um aluno para atribuir a ficha.')
      return
    }
    if (!selectedGoal) {
      toast.error('Selecione um objetivo para a ficha.')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Não autenticado.'); return }

    const finalStudentId = selectedStudentId || studentIdFromUrl || ''

    if (!finalStudentId) {
      toast.error('Selecione um aluno para atribuir a ficha.')
      return
    }

    setSaving(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: sheet, error } = await (supabase as any)
        .from('workout_sheets')
        .insert({
          academy_id: currentAcademy.id,
          student_id: finalStudentId,
          personal_id: user.id,
          name: data.name,
          goal: selectedGoal,
          description: data.description || null,
          is_active: true,
          schedule_type: scheduleType,
        })
        .select('id')
        .single()

      if (error) throw error

      // Copy template exercises if a template was selected
      if (selectedTemplate) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: tmplExs } = await (supabase as any)
          .from('template_exercises')
          .select('exercise_id, order_index, sets, reps, rest_seconds, notes')
          .eq('template_id', selectedTemplate.id)
          .order('order_index')

        if (tmplExs && tmplExs.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from('sheet_exercises')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .insert(tmplExs.map((e: any) => ({ ...e, sheet_id: sheet.id })))
        }
      }

      toast.success('Ficha criada com sucesso!')
      router.push(`/treinos/${sheet.id}`)
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Erro ao criar ficha.')
    } finally {
      setSaving(false)
    }
  }

  // Personal sem aluno cai num form que nunca pode ser submetido (precisa selecionar
  // aluno, mas a lista está vazia). Mostra empty state e link pra convidar antes.
  const noStudentsAvailable = !loadingStudents && !studentIdFromUrl && students.length === 0

  return (
    <div className="space-y-6 max-w-2xl">
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show" className="flex items-center gap-3">
        <Link href="/treinos" className="p-2 rounded-xl hover:bg-surface-200 transition-all text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="section-title">Nova ficha de treino</h2>
          <p className="section-subtitle text-xs mt-0.5">Crie a ficha e adicione exercícios depois</p>
        </div>
      </motion.div>

      {noStudentsAvailable && (
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" className="glass rounded-2xl p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-surface-200 flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-muted-foreground/40" />
          </div>
          <p className="font-semibold">Convide alunos antes de criar a ficha</p>
          <p className="text-sm text-muted-foreground/70 mt-1.5 max-w-sm mx-auto">
            Uma ficha precisa ser atribuída a um aluno. Convide pelo menos 1 aluno e volte aqui depois.
          </p>
          <Link href="/alunos" className="btn-primary text-sm py-2 px-4 rounded-xl mt-5 inline-flex items-center gap-1.5">
            <UserPlus className="w-3.5 h-3.5" />
            Convidar aluno
          </Link>
        </motion.div>
      )}

      {!noStudentsAvailable && (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* Template picker */}
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" className="glass rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-400" />
              <h3 className="font-display font-bold text-sm">Começar de um modelo</h3>
            </div>
            {selectedTemplate && (
              <button type="button" onClick={() => setSelectedTemplate(null)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                <X className="w-3 h-3" /> Remover
              </button>
            )}
          </div>

          {selectedTemplate ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-brand-500/8 border border-brand-500/20">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{selectedTemplate.name}</p>
                <p className="text-xs text-muted-foreground">{selectedTemplate.muscle_group} · {selectedTemplate.level}</p>
              </div>
              <span className="text-xs font-bold" style={{ color: LEVEL_COLORS[selectedTemplate.level] }}>{selectedTemplate.level}</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowTemplatePicker((v) => !v)}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-border/60 hover:border-brand-500/30 hover:bg-surface-100 transition-all text-sm text-muted-foreground"
            >
              <span>Selecionar modelo pronto...</span>
              <ChevronRight className={cn('w-4 h-4 transition-transform', showTemplatePicker && 'rotate-90')} />
            </button>
          )}

          {showTemplatePicker && !selectedTemplate && (
            <div className="space-y-3 pt-1">
              {/* Muscle group grid */}
              <div className="flex flex-wrap gap-1.5">
                {MUSCLE_GROUPS_ORDER.map((mg) => (
                  <button
                    key={mg}
                    type="button"
                    onClick={() => setSelectedMuscleGroup(selectedMuscleGroup === mg ? null : mg)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                      selectedMuscleGroup === mg
                        ? 'bg-brand-500 text-white border-brand-500'
                        : 'border-border/60 text-muted-foreground hover:border-brand-500/40 hover:text-foreground'
                    )}
                  >
                    {mg}
                  </button>
                ))}
              </div>

              {/* Level cards */}
              {selectedMuscleGroup && (
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {LEVEL_ORDER.map((level) => {
                    const tmpl = templates.find((t) => t.muscle_group === selectedMuscleGroup && t.level === level)
                    if (!tmpl) return null
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => applyTemplate(tmpl)}
                        className="flex flex-col gap-1 p-3 rounded-xl border border-border/60 hover:border-brand-500/30 hover:bg-surface-100 transition-all text-left"
                      >
                        <span className="text-xs font-bold" style={{ color: LEVEL_COLORS[level] }}>{level}</span>
                        <span className="text-[10px] text-muted-foreground">{selectedMuscleGroup}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Informações básicas */}
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show" className="glass rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-brand-400" />
            <h3 className="font-display font-bold text-sm">Informações básicas</h3>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nome da ficha <span className="text-red-400">*</span></label>
            <input
              {...register('name', { required: 'Nome obrigatório', minLength: { value: 3, message: 'Mínimo 3 caracteres' } })}
              placeholder="Ex: Treino A — Peito e Tríceps"
              className={cn('field', errors.name && 'border-destructive/60')}
            />
            {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Descrição (opcional)</label>
            <textarea
              {...register('description')}
              rows={2}
              placeholder="Observações sobre a ficha, foco do treino..."
              className="field resize-none"
            />
          </div>
        </motion.div>

        {/* Objetivo */}
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show" className="glass rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-brand-400" />
            <h3 className="font-display font-bold text-sm">Objetivo <span className="text-red-400">*</span></h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {GOALS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelectedGoal(g.id)}
                className={cn(
                  'flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all text-sm',
                  selectedGoal === g.id
                    ? 'border-brand-500/50 bg-brand-500/8 font-semibold'
                    : 'border-border/60 hover:border-border hover:bg-surface-100 text-muted-foreground'
                )}
              >
                <span className="text-base">{g.emoji}</span>
                <span className="flex-1 text-xs leading-tight">{g.id}</span>
                {selectedGoal === g.id && <Check className="w-3 h-3 text-brand-400 flex-shrink-0" />}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Tipo de programação */}
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show" className="glass rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-brand-400" />
            <h3 className="font-display font-bold text-sm">Tipo de programação <span className="text-red-400">*</span></h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {SCHEDULE_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setScheduleType(t.id as typeof scheduleType)}
                className={cn(
                  'flex flex-col gap-1 p-3 rounded-xl border text-left transition-all',
                  scheduleType === t.id
                    ? 'border-brand-500/50 bg-brand-500/8'
                    : 'border-border/60 hover:border-border hover:bg-surface-100'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-base">{t.emoji}</span>
                  {scheduleType === t.id && <Check className="w-3 h-3 text-brand-400" />}
                </div>
                <span className={cn('text-xs font-bold', scheduleType === t.id ? '' : 'text-muted-foreground')}>{t.label}</span>
                <span className="text-[10px] text-muted-foreground/70 leading-tight">{t.desc}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Aluno — só mostra se não veio da URL */}
        {!studentIdFromUrl && (
          <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show" className="glass rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-brand-400" />
              <h3 className="font-display font-bold text-sm">Atribuir a um aluno</h3>
            </div>

            {loadingStudents ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
              </div>
            ) : students.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Nenhum aluno cadastrado. Convide alunos antes de criar fichas.
              </p>
            ) : (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">Selecione o aluno</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="field"
                >
                  <option value="">— Selecione um aluno —</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name ?? 'Aluno sem nome'}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </motion.div>
        )}

        {/* Info */}
        <motion.div custom={5} variants={fadeUp} initial="hidden" animate="show" className="glass rounded-2xl p-4 border border-brand-500/15 bg-brand-500/5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
              <ChevronRight className="w-3.5 h-3.5 text-brand-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-300">Próximo passo</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Após criar a ficha, você será levado para a tela de detalhes onde poderá adicionar exercícios.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div custom={6} variants={fadeUp} initial="hidden" animate="show" className="flex gap-3">
          <Link href="/treinos" className="flex-1 btn-secondary py-3 rounded-xl text-sm font-semibold text-center">
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving || (students.length === 0 && !studentIdFromUrl)}
            className="flex-1 btn-primary py-3 rounded-xl text-sm font-semibold"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar ficha'}
          </button>
        </motion.div>
      </form>
      )}
    </div>
  )
}

export default function NovaFichaPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-brand-400" /></div>}>
      <NovaFichaContent />
    </Suspense>
  )
}
