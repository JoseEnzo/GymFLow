'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import {
  ArrowLeft, Loader2, Target, FileText,
  ChevronRight, Check, User,
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

function NovaFichaContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const studentIdFromUrl = searchParams.get('studentId')
  const { currentAcademy } = useAuthStore()
  const supabase = createClient()

  const [saving, setSaving] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState('')
  const [students, setStudents] = useState<StudentOption[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState(studentIdFromUrl ?? '')
  const [loadingStudents, setLoadingStudents] = useState(!studentIdFromUrl)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: { name: '', goal: '', description: '' },
  })

  useEffect(() => {
    if (studentIdFromUrl || !currentAcademy) {
      setLoadingStudents(false)
      return
    }

    async function fetchStudents() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('academy_members')
        .select('user_id, profile:profiles(full_name)')
        .eq('academy_id', currentAcademy!.id)
        .eq('role', 'student')
        .eq('is_active', true)

      const list: StudentOption[] = (data ?? []).map((m: { user_id: string; profile?: { full_name: string | null } }) => ({
        id: m.user_id,
        full_name: m.profile?.full_name ?? null,
      }))
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
    if (!selectedGoal) {
      toast.error('Selecione um objetivo para a ficha.')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Não autenticado.'); return }

    const finalStudentId = selectedStudentId || user.id

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
        })
        .select('id')
        .single()

      if (error) throw error

      toast.success('Ficha criada com sucesso!')
      router.push(`/treinos/${sheet.id}`)
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Erro ao criar ficha.')
    } finally {
      setSaving(false)
    }
  }

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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Informações básicas */}
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" className="glass rounded-2xl p-5 space-y-4">
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
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show" className="glass rounded-2xl p-5 space-y-3">
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

        {/* Aluno — só mostra se não veio da URL */}
        {!studentIdFromUrl && (
          <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show" className="glass rounded-2xl p-5 space-y-3">
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
                Nenhum aluno cadastrado. A ficha será atribuída a você mesmo.
              </p>
            ) : (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">Selecione o aluno</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="field"
                >
                  <option value="">— Para mim mesmo —</option>
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
        <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show" className="glass rounded-2xl p-4 border border-brand-500/15 bg-brand-500/5">
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
        <motion.div custom={5} variants={fadeUp} initial="hidden" animate="show" className="flex gap-3">
          <Link href="/treinos" className="flex-1 btn-secondary py-3 rounded-xl text-sm font-semibold text-center">
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 btn-primary py-3 rounded-xl text-sm font-semibold"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar ficha'}
          </button>
        </motion.div>
      </form>
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
