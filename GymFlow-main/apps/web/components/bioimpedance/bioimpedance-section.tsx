'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, X, Activity, Loader2, Calendar,
  ChevronDown, Scale, Zap, BarChart3,
  TrendingDown, Droplets, Clock, Target, Trash2,
} from 'lucide-react'
import { toast } from 'sonner'

import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { GoalProgress, GOAL_METRICS, type BioGoal, type GoalMetric } from './goal-progress'

// ── Types ────────────────────────────────────────────────────
interface BioAssessment {
  id: string
  assessed_at: string
  weight_kg: number | null
  body_fat_pct: number | null
  muscle_mass_kg: number | null
  bmi: number | null
  visceral_fat: number | null
  body_water_pct: number | null
  bone_mass_kg: number | null
  metabolic_age: number | null
  notes: string | null
}

interface BioForm {
  assessed_at: string
  weight_kg: string
  body_fat_pct: string
  muscle_mass_kg: string
  bmi: string
  visceral_fat: string
  body_water_pct: string
  bone_mass_kg: string
  metabolic_age: string
  notes: string
}

// ── Constants ────────────────────────────────────────────────
const EMPTY_FORM: BioForm = {
  assessed_at: new Date().toISOString().slice(0, 10),
  weight_kg: '',
  body_fat_pct: '',
  muscle_mass_kg: '',
  bmi: '',
  visceral_fat: '',
  body_water_pct: '',
  bone_mass_kg: '',
  metabolic_age: '',
  notes: '',
}

const METRIC_CARDS = [
  { key: 'weight_kg',      label: 'Peso',           unit: ' kg',  icon: Scale,        lowerIsBetter: false, color: 'text-brand-400'   },
  { key: 'body_fat_pct',   label: 'Gordura',         unit: '%',    icon: TrendingDown, lowerIsBetter: true,  color: 'text-amber-400'   },
  { key: 'muscle_mass_kg', label: 'Massa Muscular',  unit: ' kg',  icon: Zap,          lowerIsBetter: false, color: 'text-emerald-400' },
  { key: 'bmi',            label: 'IMC',             unit: '',     icon: BarChart3,    lowerIsBetter: false, color: 'text-cyan-400'    },
  { key: 'visceral_fat',   label: 'Gord. Visceral',  unit: '',     icon: Activity,     lowerIsBetter: true,  color: 'text-red-400'     },
  { key: 'body_water_pct', label: 'Água',            unit: '%',    icon: Droplets,     lowerIsBetter: false, color: 'text-blue-400'    },
  { key: 'bone_mass_kg',   label: 'Massa Óssea',     unit: ' kg',  icon: Scale,        lowerIsBetter: false, color: 'text-slate-400'   },
  { key: 'metabolic_age',  label: 'Idade Met.',      unit: ' anos',icon: Clock,        lowerIsBetter: true,  color: 'text-purple-400'  },
] as const

// ── Helpers ──────────────────────────────────────────────────
function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

function parse(v: string): number | null {
  const n = parseFloat(v)
  return isNaN(n) ? null : n
}

// ── Delta badge ──────────────────────────────────────────────
function DeltaBadge({
  curr, prev, unit = '', lowerIsBetter = false,
}: {
  curr: number | null
  prev: number | null
  unit?: string
  lowerIsBetter?: boolean
}) {
  if (curr === null || prev === null) return null
  const diff = curr - prev
  if (Math.abs(diff) < 0.05) return null
  const up = diff > 0
  const isGood = lowerIsBetter ? !up : up
  return (
    <span className={cn('text-[10px] font-semibold', isGood ? 'text-emerald-400' : 'text-red-400')}>
      {up ? '↑' : '↓'}{Math.abs(diff).toFixed(1)}{unit}
    </span>
  )
}

// ── Metric input ─────────────────────────────────────────────
function MetricInput({
  label, id, value, onChange, unit, step = '0.1', placeholder = '',
}: {
  label: string
  id: string
  value: string
  onChange: (v: string) => void
  unit: string
  step?: string
  placeholder?: string
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="relative">
        <input
          id={id}
          type="number"
          inputMode={step === '1' ? 'numeric' : 'decimal'}
          step={step}
          min="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || '–'}
          className="field pr-9 text-sm"
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
            {unit}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────
export function BioimpedanceSection({
  studentId,
  academyId,
  studentHeight,
  readOnly = false,
  autoOpenForm = false,
}: {
  studentId: string
  academyId: string
  studentHeight?: number | null
  readOnly?: boolean
  autoOpenForm?: boolean
}) {
  const supabase = createClient()
  const [assessments, setAssessments] = useState<BioAssessment[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [form, setForm] = useState<BioForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  // Meta de bioimpedância (1 por aluno)
  const [goal, setGoal] = useState<BioGoal | null>(null)
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [goalForm, setGoalForm] = useState<{ metric: GoalMetric; target_value: string }>({ metric: 'weight_kg', target_value: '' })
  const [savingGoal, setSavingGoal] = useState(false)

  function setField(field: keyof BioForm, value: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      // Auto-compute BMI when weight changes and height is known
      if (field === 'weight_kg' && studentHeight && studentHeight > 0) {
        const w = parseFloat(value)
        if (!isNaN(w)) {
          const h = studentHeight / 100
          next.bmi = (w / (h * h)).toFixed(1)
        }
      }
      return next
    })
  }

  useEffect(() => {
    async function load() {
      setLoading(true)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('bioimpedance_assessments')
        .select('id, assessed_at, weight_kg, body_fat_pct, muscle_mass_kg, bmi, visceral_fat, body_water_pct, bone_mass_kg, metabolic_age, notes')
        .eq('academy_id', academyId)
        .eq('student_id', studentId)
        .order('assessed_at', { ascending: false })
      if (error) toast.error('Erro ao carregar avaliações.')
      setAssessments(data ?? [])

      // Meta (tabela nova, ainda fora dos types gerados → cast)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: goalData } = await (supabase as any)
        .from('bioimpedance_goals')
        .select('metric, target_value, start_value')
        .eq('academy_id', academyId)
        .eq('student_id', studentId)
        .maybeSingle()
      setGoal(goalData ?? null)

      setLoading(false)
    }
    load()
  }, [studentId, academyId])

  // Abre o modal direto quando veio de "Nova bioimpedância" no card do aluno (?bio=new).
  useEffect(() => {
    if (autoOpenForm && !readOnly) setShowModal(true)
  }, [autoOpenForm, readOnly])

  async function save() {
    if (!form.weight_kg) { toast.error('Informe o peso.'); return }
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('bioimpedance_assessments')
        .insert({
          academy_id: academyId,
          student_id: studentId,
          personal_id: user.id,
          assessed_at: form.assessed_at,
          weight_kg:      parse(form.weight_kg),
          body_fat_pct:   parse(form.body_fat_pct),
          muscle_mass_kg: parse(form.muscle_mass_kg),
          bmi:            parse(form.bmi),
          visceral_fat:   parse(form.visceral_fat),
          body_water_pct: parse(form.body_water_pct),
          bone_mass_kg:   parse(form.bone_mass_kg),
          metabolic_age:  parse(form.metabolic_age),
          notes: form.notes.trim() || null,
        })
        .select()
        .single()

      if (error) throw error

      setAssessments((prev) =>
        [data, ...prev].sort(
          (a, b) => new Date(b.assessed_at).getTime() - new Date(a.assessed_at).getTime()
        )
      )
      setForm(EMPTY_FORM)
      setShowModal(false)
      toast.success('Avaliação de bioimpedância salva!')
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Erro ao salvar avaliação.')
    } finally {
      setSaving(false)
    }
  }

  const latest = assessments[0] ?? null
  const previous = assessments[1] ?? null
  const goalCurrent = goal && latest ? (latest[goal.metric as keyof BioAssessment] as number | null) : null

  function openGoalModal() {
    setGoalForm(goal
      ? { metric: goal.metric, target_value: String(goal.target_value) }
      : { metric: 'weight_kg', target_value: '' })
    setShowGoalModal(true)
  }

  async function saveGoal() {
    const target = parseFloat(goalForm.target_value.replace(',', '.'))
    if (isNaN(target)) { toast.error('Informe o valor-alvo da meta.'); return }
    setSavingGoal(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')
      // Baseline: preserva o start ao só editar o alvo da mesma métrica; senão
      // tira snapshot do valor atual da métrica na última avaliação (pode ser null).
      const start = goal && goal.metric === goalForm.metric
        ? goal.start_value
        : (latest ? (latest[goalForm.metric as keyof BioAssessment] as number | null) : null)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('bioimpedance_goals')
        .upsert({
          academy_id: academyId,
          student_id: studentId,
          personal_id: user.id,
          metric: goalForm.metric,
          target_value: target,
          start_value: start,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'academy_id,student_id' })
        .select('metric, target_value, start_value')
        .single()
      if (error) throw error
      setGoal(data)
      setShowGoalModal(false)
      toast.success('Meta salva!')
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Erro ao salvar meta.')
    } finally {
      setSavingGoal(false)
    }
  }

  async function removeGoal() {
    setSavingGoal(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('bioimpedance_goals')
      .delete()
      .eq('academy_id', academyId)
      .eq('student_id', studentId)
    setSavingGoal(false)
    if (error) { toast.error('Erro ao remover meta.'); return }
    setGoal(null)
    setShowGoalModal(false)
    toast.success('Meta removida.')
  }

  return (
    <>
      {/* ── Card ── */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            Bioimpedância
          </h3>
          {!readOnly && (
            <button
              onClick={() => { setForm({ ...EMPTY_FORM, assessed_at: new Date().toISOString().slice(0, 10) }); setShowModal(true) }}
              className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3 h-3" /> Nova avaliação
            </button>
          )}
        </div>

        {/* Meta — barra de progresso que o aluno também vê */}
        {!loading && (goal || !readOnly) && (
          <div className="mb-4 space-y-2">
            {goal && (
              <GoalProgress goal={goal} current={goalCurrent} audience="personal" />
            )}
            {!readOnly && (
              goal ? (
                <div className="flex gap-2">
                  <button
                    onClick={openGoalModal}
                    className="btn-secondary flex-1 py-2 rounded-xl text-xs font-semibold"
                  >
                    Editar meta
                  </button>
                  <button
                    onClick={removeGoal}
                    disabled={savingGoal}
                    title="Remover meta"
                    className="px-3 py-2 rounded-xl text-xs text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={openGoalModal}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold border border-dashed border-brand-500/30 text-brand-300 hover:bg-brand-500/10 transition-all"
                >
                  <Target className="w-3.5 h-3.5" /> Definir meta de bioimpedância
                </button>
              )
            )}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-brand-400" />
          </div>
        ) : latest === null ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-3">
              <Activity className="w-5 h-5 text-cyan-400/40" />
            </div>
            <p className="text-sm text-muted-foreground">Nenhuma avaliação registrada</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Registre a composição corporal do aluno usando uma balança de bioimpedância.
            </p>
            {!readOnly && (
              <button
                onClick={() => { setForm({ ...EMPTY_FORM, assessed_at: new Date().toISOString().slice(0, 10) }); setShowModal(true) }}
                className="btn-primary text-xs py-2 px-4 rounded-xl mt-3 inline-flex items-center gap-1.5"
              >
                <Plus className="w-3 h-3" /> Registrar avaliação
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Date row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(latest.assessed_at)}
              </div>
              {previous && (
                <span className="text-[10px] text-muted-foreground bg-surface-200 px-2 py-0.5 rounded-full">
                  vs {formatDate(previous.assessed_at)}
                </span>
              )}
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {METRIC_CARDS.map(({ key, label, unit, icon: Icon, lowerIsBetter, color }) => {
                const v = latest[key as keyof BioAssessment] as number | null
                if (v === null) return null
                const pv = (previous?.[key as keyof BioAssessment] as number | null) ?? null
                return (
                  <div key={key} className="flex items-start gap-2.5 p-3 rounded-xl bg-surface-100">
                    <Icon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', color)} />
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-bold text-sm">
                          {typeof v === 'number' ? v % 1 === 0 ? v : v.toFixed(1) : v}{unit}
                        </p>
                        <DeltaBadge curr={v} prev={pv} unit={unit.trim()} lowerIsBetter={lowerIsBetter} />
                      </div>
                      <p className="text-[10px] text-muted-foreground">{label}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {latest.notes && (
              <p className="text-xs text-muted-foreground bg-surface-100 rounded-xl p-3 italic">
                {latest.notes}
              </p>
            )}

            {/* History toggle */}
            {assessments.length > 1 && (
              <>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors pt-1"
                >
                  <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200', showHistory && 'rotate-180')} />
                  {showHistory ? 'Ocultar histórico' : `Histórico · ${assessments.length - 1} avaliação${assessments.length - 1 !== 1 ? 'ões' : ''} anterior${assessments.length - 1 !== 1 ? 'es' : ''}`}
                </button>

                <AnimatePresence>
                  {showHistory && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-2 pt-1">
                        {assessments.slice(1).map((a) => (
                          <div key={a.id} className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-border/40 text-xs">
                            <span className="flex items-center gap-1 text-muted-foreground font-medium">
                              <Calendar className="w-3 h-3" />
                              {formatDate(a.assessed_at)}
                            </span>
                            {a.weight_kg      != null && <span className="text-foreground/80">{a.weight_kg}kg</span>}
                            {a.body_fat_pct   != null && <span className="text-amber-400/80">{a.body_fat_pct}% gord.</span>}
                            {a.muscle_mass_kg != null && <span className="text-emerald-400/80">{a.muscle_mass_kg}kg musc.</span>}
                            {a.bmi            != null && <span className="text-cyan-400/80">IMC {a.bmi}</span>}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-lg glass rounded-2xl p-6 border border-border/60 shadow-2xl overflow-y-auto max-h-[90vh]"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/15 flex items-center justify-center">
                      <Activity className="w-4.5 h-4.5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold">Nova avaliação</h3>
                      <p className="text-xs text-muted-foreground">Bioimpedância corporal</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-200 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Date */}
                <div className="space-y-1.5 mb-5">
                  <label className="text-xs font-medium text-muted-foreground">Data da avaliação</label>
                  <input
                    type="date"
                    value={form.assessed_at}
                    onChange={(e) => setField('assessed_at', e.target.value)}
                    className="field text-sm"
                  />
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <MetricInput
                    label="Peso *"
                    id="weight_kg"
                    value={form.weight_kg}
                    onChange={(v) => setField('weight_kg', v)}
                    unit="kg"
                    placeholder="ex: 72.5"
                  />
                  <MetricInput
                    label="% Gordura Corporal"
                    id="body_fat_pct"
                    value={form.body_fat_pct}
                    onChange={(v) => setField('body_fat_pct', v)}
                    unit="%"
                    placeholder="ex: 18.2"
                  />
                  <MetricInput
                    label="Massa Muscular"
                    id="muscle_mass_kg"
                    value={form.muscle_mass_kg}
                    onChange={(v) => setField('muscle_mass_kg', v)}
                    unit="kg"
                    placeholder="ex: 35.0"
                  />
                  <MetricInput
                    label="IMC"
                    id="bmi"
                    value={form.bmi}
                    onChange={(v) => setField('bmi', v)}
                    unit=""
                    step="0.01"
                    placeholder={studentHeight ? 'auto' : 'ex: 22.4'}
                  />
                  <MetricInput
                    label="Gordura Visceral"
                    id="visceral_fat"
                    value={form.visceral_fat}
                    onChange={(v) => setField('visceral_fat', v)}
                    unit="nível"
                    step="1"
                    placeholder="1 – 30"
                  />
                  <MetricInput
                    label="% Água Corporal"
                    id="body_water_pct"
                    value={form.body_water_pct}
                    onChange={(v) => setField('body_water_pct', v)}
                    unit="%"
                    placeholder="ex: 58.0"
                  />
                  <MetricInput
                    label="Massa Óssea"
                    id="bone_mass_kg"
                    value={form.bone_mass_kg}
                    onChange={(v) => setField('bone_mass_kg', v)}
                    unit="kg"
                    step="0.01"
                    placeholder="ex: 2.80"
                  />
                  <MetricInput
                    label="Idade Metabólica"
                    id="metabolic_age"
                    value={form.metabolic_age}
                    onChange={(v) => setField('metabolic_age', v)}
                    unit="anos"
                    step="1"
                    placeholder="ex: 28"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-1.5 mb-6">
                  <label className="text-xs font-medium text-muted-foreground">Observações</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setField('notes', e.target.value)}
                    placeholder="Horário da avaliação, hidratação, estado do aluno..."
                    className="field text-sm resize-none"
                    rows={3}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowModal(false)}
                    className="btn-secondary flex-1 py-3 rounded-xl text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={save}
                    disabled={saving || !form.weight_kg}
                    className="btn-primary flex-1 py-3 rounded-xl text-sm font-semibold"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar avaliação'}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ── Modal de meta ── */}
      <AnimatePresence>
        {showGoalModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowGoalModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-sm glass rounded-2xl p-6 border border-border/60 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-brand-500/15 flex items-center justify-center">
                      <Target className="w-4.5 h-4.5 text-brand-400" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold">{goal ? 'Editar meta' : 'Definir meta'}</h3>
                      <p className="text-xs text-muted-foreground">O aluno vê o progresso</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowGoalModal(false)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-200 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Métrica</label>
                    <select
                      value={goalForm.metric}
                      onChange={(e) => setGoalForm((f) => ({ ...f, metric: e.target.value as GoalMetric }))}
                      className="field text-sm"
                    >
                      {(Object.keys(GOAL_METRICS) as GoalMetric[]).map((k) => (
                        <option key={k} value={k}>
                          {GOAL_METRICS[k].label}{GOAL_METRICS[k].unit ? ` (${GOAL_METRICS[k].unit})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Valor-alvo {GOAL_METRICS[goalForm.metric].unit && `(${GOAL_METRICS[goalForm.metric].unit})`}
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      value={goalForm.target_value}
                      onChange={(e) => setGoalForm((f) => ({ ...f, target_value: e.target.value }))}
                      placeholder="ex: 75"
                      className="field text-sm"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      O progresso é medido do valor atual do aluno até esse alvo.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => setShowGoalModal(false)}
                    className="btn-secondary flex-1 py-3 rounded-xl text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={saveGoal}
                    disabled={savingGoal || !goalForm.target_value}
                    className="btn-primary flex-1 py-3 rounded-xl text-sm font-semibold"
                  >
                    {savingGoal ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar meta'}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
