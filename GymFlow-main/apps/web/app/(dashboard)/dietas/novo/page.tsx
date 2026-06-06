'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Loader2, Target, FileText, Check, User, Flame, Salad, Sparkles, X,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { DIET_GOALS } from '@gymflow/database'

import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { cn, DIET_GOAL_COLORS } from '@/lib/utils'

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] } }),
}

const GOAL_EMOJI: Record<string, string> = {
  Emagrecimento: '🔥', Hipertrofia: '💪', Manutenção: '⚖️', Definição: '✨', Performance: '🚀',
}

interface StudentOption { id: string; full_name: string | null }
interface DietTemplate {
  id: string
  name: string
  goal: string | null
  description: string | null
  daily_calories: number | null
  level: string
  item_count?: number
}

function NovoPlanoContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const studentIdFromUrl = searchParams.get('studentId')
  const { currentAcademy } = useAuthStore()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any

  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [dailyCalories, setDailyCalories] = useState('')
  const [selectedGoal, setSelectedGoal] = useState('')
  const [students, setStudents] = useState<StudentOption[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState(studentIdFromUrl ?? '')
  const [loadingStudents, setLoadingStudents] = useState(!studentIdFromUrl)
  const [templates, setTemplates] = useState<DietTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<DietTemplate | null>(null)
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)

  // Carrega dietas prontas
  useEffect(() => {
    supabase
      .from('diet_templates')
      .select('id, name, goal, description, daily_calories, level, diet_template_items ( id )')
      .order('name')
      .then(({ data }: { data: { id: string; name: string; goal: string | null; description: string | null; daily_calories: number | null; level: string; diet_template_items: { id: string }[] }[] | null }) => {
        if (data) setTemplates(data.map((t) => ({ ...t, item_count: t.diet_template_items?.length ?? 0 })))
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Carrega alunos
  useEffect(() => {
    if (studentIdFromUrl || !currentAcademy) { setLoadingStudents(false); return }
    async function fetchStudents() {
      const { data: members } = await supabase
        .from('academy_members')
        .select('user_id')
        .eq('academy_id', currentAcademy!.id)
        .eq('role', 'student')
        .eq('is_active', true)
      const userIds: string[] = (members ?? []).map((m: { user_id: string }) => m.user_id)
      const { data: profilesData } = userIds.length > 0
        ? await supabase.from('profiles').select('id, full_name').in('id', userIds)
        : { data: [] }
      const profileMap: Record<string, string | null> = {}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(profilesData ?? []).forEach((p: any) => { profileMap[p.id] = p.full_name ?? null })
      setStudents(userIds.map((id) => ({ id, full_name: profileMap[id] ?? null })))
      setLoadingStudents(false)
    }
    fetchStudents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAcademy, studentIdFromUrl])

  function applyTemplate(t: DietTemplate) {
    setSelectedTemplate(t)
    setName(t.name)
    if (t.goal) setSelectedGoal(t.goal)
    if (t.daily_calories) setDailyCalories(String(t.daily_calories))
    if (t.description) setDescription(t.description)
    setShowTemplatePicker(false)
  }

  async function handleSubmit() {
    if (!currentAcademy) { toast.error('Você precisa estar em uma academia.'); return }
    const finalStudentId = selectedStudentId || studentIdFromUrl || ''
    if (!finalStudentId) { toast.error('Selecione um aluno para atribuir o plano.'); return }
    if (!name.trim()) { toast.error('Dê um nome ao plano.'); return }
    if (!selectedGoal) { toast.error('Selecione um objetivo.'); return }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Não autenticado.'); return }

    setSaving(true)
    try {
      const { data: plan, error } = await supabase
        .from('meal_plans')
        .insert({
          academy_id: currentAcademy.id,
          student_id: finalStudentId,
          personal_id: user.id,
          name: name.trim(),
          goal: selectedGoal,
          description: description.trim() || null,
          daily_calories: parseInt(dailyCalories) || null,
          is_active: true,
        })
        .select('id')
        .single()

      if (error) throw error

      // Copia itens da dieta pronta, se escolhida
      if (selectedTemplate) {
        const { data: items } = await supabase
          .from('diet_template_items')
          .select('recipe_id, meal_type, order_index, servings')
          .eq('template_id', selectedTemplate.id)
          .order('order_index')
        if (items && items.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await supabase.from('meal_plan_items').insert(items.map((it: any) => ({ ...it, plan_id: plan.id })))
        }
      }

      toast.success('Plano alimentar criado!')
      router.push(`/dietas/${plan.id}`)
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Erro ao criar plano.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show" className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-surface-200 transition-all text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="section-title">Novo plano alimentar</h2>
          <p className="section-subtitle mt-0.5">Atribua uma dieta ao seu aluno</p>
        </div>
      </motion.div>

      {/* Aluno */}
      {!studentIdFromUrl && (
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" className="glass rounded-2xl p-5 space-y-3">
          <label className="text-sm font-medium flex items-center gap-2"><User className="w-4 h-4 text-brand-400" /> Aluno</label>
          {loadingStudents ? (
            <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-brand-400" /></div>
          ) : students.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum aluno na academia. <Link href="/alunos" className="text-brand-400 hover:underline">Convide um aluno</Link>.</p>
          ) : (
            <select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)} className="field">
              <option value="">Selecione um aluno...</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.full_name ?? 'Aluno sem nome'}</option>)}
            </select>
          )}
        </motion.div>
      )}

      {/* Dieta pronta */}
      <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show" className="glass rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium flex items-center gap-2"><Sparkles className="w-4 h-4 text-brand-400" /> Começar de uma dieta pronta <span className="text-xs text-muted-foreground">(opcional)</span></label>
          {selectedTemplate && (
            <button onClick={() => { setSelectedTemplate(null) }} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              <X className="w-3 h-3" /> Remover
            </button>
          )}
        </div>
        {selectedTemplate ? (
          <div className="rounded-xl border border-brand-500/30 bg-brand-500/5 p-3">
            <p className="font-semibold text-sm">{selectedTemplate.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{selectedTemplate.item_count} refeições · {selectedTemplate.daily_calories} kcal/dia</p>
          </div>
        ) : (
          <button onClick={() => setShowTemplatePicker((v) => !v)} className="btn-secondary text-sm py-2.5 rounded-xl w-full">
            {showTemplatePicker ? 'Fechar' : 'Escolher dieta pronta'}
          </button>
        )}
        {showTemplatePicker && !selectedTemplate && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pt-1">
            {templates.map((t) => {
              const color = DIET_GOAL_COLORS[t.goal ?? ''] ?? '#10B981'
              return (
                <button key={t.id} onClick={() => applyTemplate(t)} className="text-left rounded-xl border border-border/60 p-3 hover:border-brand-500/30 hover:bg-surface-100 transition-all">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="font-semibold text-sm">{t.name}</p>
                    <span className="badge text-[9px]" style={{ background: `${color}15`, color, borderColor: `${color}30` }}>{t.level}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{t.item_count} refeições · {t.daily_calories} kcal · {t.goal}</p>
                </button>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* Nome + objetivo */}
      <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show" className="glass rounded-2xl p-5 space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium flex items-center gap-2"><FileText className="w-4 h-4 text-brand-400" /> Nome do plano</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Plano de cutting — Maio" className="field" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2"><Target className="w-4 h-4 text-brand-400" /> Objetivo</label>
          <div className="flex flex-wrap gap-2">
            {DIET_GOALS.map((g) => {
              const active = selectedGoal === g
              const color = DIET_GOAL_COLORS[g] ?? '#10B981'
              return (
                <button key={g} type="button" onClick={() => setSelectedGoal(g)}
                  className={cn('px-3.5 py-2 rounded-xl text-sm font-medium border transition-all', active ? 'text-white' : 'text-muted-foreground hover:text-foreground')}
                  style={active ? { background: color, borderColor: color } : { borderColor: 'hsl(var(--border) / 0.6)' }}>
                  {GOAL_EMOJI[g]} {g}
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium flex items-center gap-2"><Flame className="w-4 h-4 text-brand-400" /> Meta de calorias/dia <span className="text-xs text-muted-foreground">(opcional)</span></label>
          <input value={dailyCalories} onChange={(e) => setDailyCalories(e.target.value)} inputMode="numeric" placeholder="2000" className="field" />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Observações <span className="text-xs text-muted-foreground">(opcional)</span></label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Orientações gerais, restrições, hidratação..." className="field text-sm resize-none" />
        </div>
      </motion.div>

      <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show" className="flex gap-3">
        <button onClick={() => router.back()} className="flex-1 btn-secondary py-3 rounded-xl text-sm">Cancelar</button>
        <button onClick={handleSubmit} disabled={saving} className="flex-1 btn-primary py-3 rounded-xl text-sm flex items-center justify-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Criar plano</>}
        </button>
      </motion.div>
    </div>
  )
}

export default function NovoPlanoPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-brand-400" /></div>}>
      <NovoPlanoContent />
    </Suspense>
  )
}
