'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity, Ruler, Calendar, ChevronDown, Loader2,
  Scale, Zap, BarChart3, TrendingDown, Droplets, Clock,
} from 'lucide-react'

import { toast } from 'sonner'

import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { GoalProgress, type BioGoal } from './goal-progress'

// ── Types ─────────────────────────────────────────────────────
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

interface BodyMeasurement {
  id: string
  measured_at: string
  chest_cm: number | null
  waist_cm: number | null
  abdomen_cm: number | null
  hip_cm: number | null
  arm_right_cm: number | null
  arm_left_cm: number | null
  thigh_right_cm: number | null
  thigh_left_cm: number | null
  calf_right_cm: number | null
  calf_left_cm: number | null
  neck_cm: number | null
  shoulder_cm: number | null
  forearm_right_cm: number | null
  forearm_left_cm: number | null
  notes: string | null
}

// ── Constants ─────────────────────────────────────────────────
const BIO_CARDS = [
  { key: 'weight_kg',      label: 'Peso',          unit: ' kg',   icon: Scale,        lowerIsBetter: false, color: 'text-brand-400'   },
  { key: 'body_fat_pct',   label: 'Gordura',        unit: '%',     icon: TrendingDown, lowerIsBetter: true,  color: 'text-amber-400'   },
  { key: 'muscle_mass_kg', label: 'Massa Muscular', unit: ' kg',   icon: Zap,          lowerIsBetter: false, color: 'text-emerald-400' },
  { key: 'bmi',            label: 'IMC',            unit: '',      icon: BarChart3,    lowerIsBetter: false, color: 'text-cyan-400'    },
  { key: 'visceral_fat',   label: 'Gord. Visceral', unit: '',      icon: Activity,     lowerIsBetter: true,  color: 'text-red-400'     },
  { key: 'body_water_pct', label: 'Água Corporal',  unit: '%',     icon: Droplets,     lowerIsBetter: false, color: 'text-blue-400'    },
  { key: 'bone_mass_kg',   label: 'Massa Óssea',   unit: ' kg',   icon: Scale,        lowerIsBetter: false, color: 'text-slate-400'   },
  { key: 'metabolic_age',  label: 'Idade Met.',     unit: ' anos', icon: Clock,        lowerIsBetter: true,  color: 'text-purple-400'  },
] as const

const MEASURE_SUMMARY = [
  { key: 'chest_cm',      label: 'Tórax'      },
  { key: 'waist_cm',      label: 'Cintura'    },
  { key: 'abdomen_cm',    label: 'Abdômen'    },
  { key: 'hip_cm',        label: 'Quadril'    },
  { key: 'arm_right_cm',  label: 'Braço D'    },
  { key: 'thigh_right_cm',label: 'Coxa D'     },
] as const

const MEASURE_EXTRA = [
  { key: 'arm_left_cm',      label: 'Braço E'       },
  { key: 'forearm_right_cm', label: 'Antebraço D'   },
  { key: 'forearm_left_cm',  label: 'Antebraço E'   },
  { key: 'thigh_left_cm',    label: 'Coxa E'        },
  { key: 'calf_right_cm',    label: 'Panturrilha D' },
  { key: 'calf_left_cm',     label: 'Panturrilha E' },
  { key: 'neck_cm',          label: 'Pescoço'       },
  { key: 'shoulder_cm',      label: 'Ombro'         },
] as const

// ── Helpers ───────────────────────────────────────────────────
function fmtDate(d: string) {
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function DeltaBadge({ curr, prev, lowerIsBetter = false }: {
  curr: number | null; prev: number | null; lowerIsBetter?: boolean
}) {
  if (curr == null || prev == null) return null
  const diff = curr - prev
  if (Math.abs(diff) < 0.05) return null
  const up = diff > 0
  const good = lowerIsBetter ? !up : up
  return (
    <span className={cn('text-[10px] font-semibold', good ? 'text-emerald-400' : 'text-red-400')}>
      {up ? '↑' : '↓'}{Math.abs(diff).toFixed(1)}
    </span>
  )
}

// ── Bioimpedância card ─────────────────────────────────────────
function BioCard({ studentId }: { studentId: string }) {
  const supabase = createClient()
  const [assessments, setAssessments] = useState<BioAssessment[]>([])
  const [goal, setGoal] = useState<BioGoal | null>(null)
  const [loading, setLoading] = useState(true)
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      // RLS garante que o aluno só vê seus próprios dados
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('bioimpedance_assessments')
        .select('id, assessed_at, weight_kg, body_fat_pct, muscle_mass_kg, bmi, visceral_fat, body_water_pct, bone_mass_kg, metabolic_age, notes')
        .eq('student_id', studentId)
        .order('assessed_at', { ascending: false })
      if (error) toast.error('Erro ao carregar avaliações.')
      setAssessments(data ?? [])

      // Meta definida pelo personal (tabela nova, ainda fora dos types gerados → cast)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: goalData } = await (supabase as any)
        .from('bioimpedance_goals')
        .select('metric, target_value, start_value')
        .eq('student_id', studentId)
        .maybeSingle()
      setGoal(goalData ?? null)

      setLoading(false)
    }
    void load()
  }, [studentId])

  const latest = assessments[0] ?? null
  const previous = assessments[1] ?? null
  const goalCurrent = goal && latest ? (latest[goal.metric as keyof BioAssessment] as number | null) : null

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-cyan-400" />
        <h3 className="font-display font-bold text-sm">Bioimpedância</h3>
        {assessments.length > 0 && (
          <span className="ml-auto text-[10px] text-muted-foreground bg-surface-200 px-2 py-0.5 rounded-full">
            {assessments.length} avaliação{assessments.length !== 1 ? 'ões' : ''}
          </span>
        )}
      </div>

      {!loading && goal && (
        <div className="mb-4">
          <GoalProgress goal={goal} current={goalCurrent} audience="student" />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-brand-400" />
        </div>
      ) : latest === null ? (
        <div className="flex flex-col items-center py-8 text-center">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-3">
            <Activity className="w-5 h-5 text-cyan-400/30" />
          </div>
          <p className="text-sm text-muted-foreground">Nenhuma avaliação ainda</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Seu personal irá registrar sua composição corporal.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              {fmtDate(latest.assessed_at)}
            </div>
            {previous && (
              <span className="text-[10px] text-muted-foreground bg-surface-200 px-2 py-0.5 rounded-full">
                vs {fmtDate(previous.assessed_at)}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {BIO_CARDS.map(({ key, label, unit, icon: Icon, lowerIsBetter, color }) => {
              const v = latest[key as keyof BioAssessment] as number | null
              if (v === null) return null
              const pv = (previous?.[key as keyof BioAssessment] as number | null) ?? null
              return (
                <div key={key} className="flex items-start gap-2.5 p-3 rounded-xl bg-surface-100">
                  <Icon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', color)} />
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-bold text-sm">
                        {typeof v === 'number' ? (v % 1 === 0 ? v : v.toFixed(1)) : v}{unit}
                      </p>
                      <DeltaBadge curr={v} prev={pv} lowerIsBetter={lowerIsBetter} />
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

          {assessments.length > 1 && (
            <>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors pt-1"
              >
                <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200', showHistory && 'rotate-180')} />
                {showHistory
                  ? 'Ocultar histórico'
                  : `Histórico · ${assessments.length - 1} avaliação${assessments.length - 1 !== 1 ? 'ões' : ''} anterior${assessments.length - 1 !== 1 ? 'es' : ''}`}
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
                            {fmtDate(a.assessed_at)}
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
  )
}

// ── Medidas corporais card ─────────────────────────────────────
function MeasuresCard({ studentId }: { studentId: string }) {
  const supabase = createClient()
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([])
  const [loading, setLoading] = useState(true)
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      // RLS garante que o aluno só vê seus próprios dados
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('body_measurements')
        .select('*')
        .eq('student_id', studentId)
        .order('measured_at', { ascending: false })
      if (error) toast.error('Erro ao carregar medidas.')
      setMeasurements(data ?? [])
      setLoading(false)
    }
    void load()
  }, [studentId])

  const latest = measurements[0] ?? null
  const previous = measurements[1] ?? null

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Ruler className="w-4 h-4 text-indigo-400" />
        <h3 className="font-display font-bold text-sm">Medidas Corporais</h3>
        {measurements.length > 0 && (
          <span className="ml-auto text-[10px] text-muted-foreground bg-surface-200 px-2 py-0.5 rounded-full">
            {measurements.length} medição{measurements.length !== 1 ? 'ões' : ''}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-brand-400" />
        </div>
      ) : latest === null ? (
        <div className="flex flex-col items-center py-8 text-center">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-3">
            <Ruler className="w-5 h-5 text-indigo-400/30" />
          </div>
          <p className="text-sm text-muted-foreground">Nenhuma medição ainda</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Seu personal irá registrar suas circunferências corporais.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              {fmtDate(latest.measured_at)}
            </div>
            {previous && (
              <span className="text-[10px] text-muted-foreground bg-surface-200 px-2 py-0.5 rounded-full">
                vs {fmtDate(previous.measured_at)}
              </span>
            )}
          </div>

          {/* Summary grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {MEASURE_SUMMARY.map(({ key, label }) => {
              const v = latest[key as keyof BodyMeasurement] as number | null
              if (v == null) return null
              const pv = (previous?.[key as keyof BodyMeasurement] as number | null) ?? null
              const lowerIsBetter = key === 'waist_cm' || key === 'abdomen_cm'
              return (
                <div key={key} className="flex items-center gap-2 p-3 rounded-xl bg-surface-100">
                  <Ruler className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-sm">{(v as number).toFixed(1)} <span className="text-xs font-normal text-muted-foreground">cm</span></p>
                      <DeltaBadge curr={v} prev={pv} lowerIsBetter={lowerIsBetter} />
                    </div>
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Extra measurements as chips */}
          {(() => {
            const extra = MEASURE_EXTRA.filter(({ key }) => latest[key as keyof BodyMeasurement] != null)
            if (extra.length === 0) return null
            return (
              <div className="flex flex-wrap gap-2">
                {extra.map(({ key, label }) => {
                  const v = latest[key as keyof BodyMeasurement] as number
                  const pv = (previous?.[key as keyof BodyMeasurement] as number | null) ?? null
                  return (
                    <div key={key} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-100 text-xs">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-semibold">{v.toFixed(1)}</span>
                      <DeltaBadge curr={v} prev={pv} />
                    </div>
                  )
                })}
              </div>
            )
          })()}

          {latest.notes && (
            <p className="text-xs text-muted-foreground bg-surface-100 rounded-xl p-3 italic">
              {latest.notes}
            </p>
          )}

          {measurements.length > 1 && (
            <>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors pt-1"
              >
                <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200', showHistory && 'rotate-180')} />
                {showHistory
                  ? 'Ocultar histórico'
                  : `Histórico · ${measurements.length - 1} medição${measurements.length - 1 !== 1 ? 'ões' : ''} anterior${measurements.length - 1 !== 1 ? 'es' : ''}`}
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
                      {measurements.slice(1).map((m) => (
                        <div key={m.id} className="flex flex-wrap items-center gap-2 p-3 rounded-xl border border-border/40 text-xs">
                          <span className="flex items-center gap-1 text-muted-foreground font-medium">
                            <Calendar className="w-3 h-3" />
                            {fmtDate(m.measured_at)}
                          </span>
                          {m.chest_cm    != null && <span className="text-foreground/70">Tórax {m.chest_cm}cm</span>}
                          {m.waist_cm    != null && <span className="text-foreground/70">Cintura {m.waist_cm}cm</span>}
                          {m.hip_cm      != null && <span className="text-foreground/70">Quadril {m.hip_cm}cm</span>}
                          {m.arm_right_cm != null && <span className="text-foreground/70">Braço D {m.arm_right_cm}cm</span>}
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
  )
}

// ── Exported wrapper ──────────────────────────────────────────
export function StudentBioView({ studentId }: { studentId: string }) {
  return (
    <div className="space-y-4">
      <BioCard studentId={studentId} />
      <MeasuresCard studentId={studentId} />
    </div>
  )
}
