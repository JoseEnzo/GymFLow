'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Ruler, Loader2, Calendar, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'

import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

// ── Types ────────────────────────────────────────────────────
interface BodyMeasurement {
  id: string
  measured_at: string
  neck_cm: number | null
  shoulder_cm: number | null
  chest_cm: number | null
  waist_cm: number | null
  abdomen_cm: number | null
  hip_cm: number | null
  arm_right_cm: number | null
  arm_left_cm: number | null
  forearm_right_cm: number | null
  forearm_left_cm: number | null
  thigh_right_cm: number | null
  thigh_left_cm: number | null
  calf_right_cm: number | null
  calf_left_cm: number | null
  notes: string | null
}

type MeasurementKey = keyof Omit<BodyMeasurement, 'id' | 'measured_at' | 'notes'>

type MeasurementForm = Record<MeasurementKey, string> & { measured_at: string; notes: string }

// ── Constants ────────────────────────────────────────────────
const GROUPS: { label: string; fields: { key: MeasurementKey; label: string }[] }[] = [
  {
    label: 'Tronco',
    fields: [
      { key: 'neck_cm',     label: 'Pescoço'  },
      { key: 'shoulder_cm', label: 'Ombro'    },
      { key: 'chest_cm',    label: 'Tórax'    },
      { key: 'waist_cm',    label: 'Cintura'  },
      { key: 'abdomen_cm',  label: 'Abdômen'  },
      { key: 'hip_cm',      label: 'Quadril'  },
    ],
  },
  {
    label: 'Braços',
    fields: [
      { key: 'arm_right_cm',     label: 'Braço D'       },
      { key: 'arm_left_cm',      label: 'Braço E'       },
      { key: 'forearm_right_cm', label: 'Antebraço D'   },
      { key: 'forearm_left_cm',  label: 'Antebraço E'   },
    ],
  },
  {
    label: 'Pernas',
    fields: [
      { key: 'thigh_right_cm', label: 'Coxa D'          },
      { key: 'thigh_left_cm',  label: 'Coxa E'          },
      { key: 'calf_right_cm',  label: 'Panturrilha D'   },
      { key: 'calf_left_cm',   label: 'Panturrilha E'   },
    ],
  },
]

// Summary cards shown in the "latest" view (most clinically relevant)
const SUMMARY_KEYS: MeasurementKey[] = [
  'chest_cm', 'waist_cm', 'abdomen_cm', 'hip_cm',
  'arm_right_cm', 'thigh_right_cm',
]

const LABEL: Record<MeasurementKey, string> = {
  neck_cm: 'Pescoço', shoulder_cm: 'Ombro', chest_cm: 'Tórax',
  waist_cm: 'Cintura', abdomen_cm: 'Abdômen', hip_cm: 'Quadril',
  arm_right_cm: 'Braço D', arm_left_cm: 'Braço E',
  forearm_right_cm: 'Antebraço D', forearm_left_cm: 'Antebraço E',
  thigh_right_cm: 'Coxa D', thigh_left_cm: 'Coxa E',
  calf_right_cm: 'Panturrilha D', calf_left_cm: 'Panturrilha E',
}

// Fields where lower is better (waist, abdomen for example – debatable, keep neutral)
const LOWER_IS_BETTER: Partial<Record<MeasurementKey, boolean>> = {
  waist_cm: true,
  abdomen_cm: true,
}

const ALL_MEASUREMENT_KEYS = GROUPS.flatMap((g) => g.fields.map((f) => f.key))

function emptyForm(): MeasurementForm {
  const base = { measured_at: new Date().toISOString().slice(0, 10), notes: '' }
  return ALL_MEASUREMENT_KEYS.reduce(
    (acc, k) => ({ ...acc, [k]: '' }),
    base as MeasurementForm,
  )
}

// ── Helpers ──────────────────────────────────────────────────
function formatDate(d: string) {
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function parse(v: string): number | null {
  const n = parseFloat(v)
  return isNaN(n) ? null : n
}

// ── Delta badge ──────────────────────────────────────────────
function DeltaBadge({ curr, prev, lowerIsBetter = false }: {
  curr: number | null; prev: number | null; lowerIsBetter?: boolean
}) {
  if (curr == null || prev == null) return null
  const diff = curr - prev
  if (Math.abs(diff) < 0.1) return null
  const up = diff > 0
  const good = lowerIsBetter ? !up : up
  return (
    <span className={cn('text-[10px] font-semibold', good ? 'text-emerald-400' : 'text-red-400')}>
      {up ? '↑' : '↓'}{Math.abs(diff).toFixed(1)}
    </span>
  )
}

// ── Metric input ─────────────────────────────────────────────
function MeasureInput({ label, id, value, onChange }: {
  label: string; id: string; value: string; onChange: (v: string) => void
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="relative">
        <input
          id={id}
          type="number"
          step="0.1"
          min="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="–"
          className="field pr-8 text-sm"
        />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">cm</span>
      </div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────
export function MeasurementsSection({ studentId, academyId }: {
  studentId: string
  academyId: string
}) {
  const supabase = createClient()
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [form, setForm] = useState<MeasurementForm>(emptyForm)
  const [saving, setSaving] = useState(false)

  function setField(key: keyof MeasurementForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  useEffect(() => {
    async function load() {
      setLoading(true)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('body_measurements')
        .select('*')
        .eq('academy_id', academyId)
        .eq('student_id', studentId)
        .order('measured_at', { ascending: false })
      setMeasurements(data ?? [])
      setLoading(false)
    }
    load()
  }, [studentId, academyId])

  async function save() {
    const hasAny = ALL_MEASUREMENT_KEYS.some((k) => form[k] !== '')
    if (!hasAny) { toast.error('Preencha ao menos uma medida.'); return }
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      const payload = ALL_MEASUREMENT_KEYS.reduce(
        (acc, k) => ({ ...acc, [k]: parse(form[k]) }),
        {
          academy_id: academyId,
          student_id: studentId,
          personal_id: user.id,
          measured_at: form.measured_at,
          notes: form.notes.trim() || null,
        },
      )

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('body_measurements')
        .insert(payload)
        .select()
        .single()

      if (error) throw error

      setMeasurements((prev) =>
        [data, ...prev].sort(
          (a, b) => new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime(),
        ),
      )
      setForm(emptyForm())
      setShowModal(false)
      toast.success('Medidas salvas!')
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Erro ao salvar medidas.')
    } finally {
      setSaving(false)
    }
  }

  const latest = measurements[0] ?? null
  const previous = measurements[1] ?? null

  const summaryCols = SUMMARY_KEYS.filter(
    (k) => latest?.[k] != null,
  )

  return (
    <>
      {/* ── Card ── */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-sm flex items-center gap-2">
            <Ruler className="w-4 h-4 text-indigo-400" />
            Medidas Corporais
          </h3>
          <button
            onClick={() => { setForm(emptyForm()); setShowModal(true) }}
            className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3 h-3" /> Nova medição
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-brand-400" />
          </div>
        ) : latest === null ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-3">
              <Ruler className="w-5 h-5 text-indigo-400/40" />
            </div>
            <p className="text-sm text-muted-foreground">Nenhuma medição registrada</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Registre as circunferências corporais para acompanhar a evolução.
            </p>
            <button
              onClick={() => { setForm(emptyForm()); setShowModal(true) }}
              className="btn-primary text-xs py-2 px-4 rounded-xl mt-3 inline-flex items-center gap-1.5"
            >
              <Plus className="w-3 h-3" /> Registrar medidas
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Date row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(latest.measured_at)}
              </div>
              {previous && (
                <span className="text-[10px] text-muted-foreground bg-surface-200 px-2 py-0.5 rounded-full">
                  vs {formatDate(previous.measured_at)}
                </span>
              )}
            </div>

            {/* Summary metrics */}
            {summaryCols.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {summaryCols.map((k) => {
                  const v = latest[k]!
                  const pv = previous?.[k] ?? null
                  return (
                    <div key={k} className="flex items-center gap-2 p-3 rounded-xl bg-surface-100">
                      <Ruler className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-sm">{v.toFixed(1)} <span className="text-xs font-normal text-muted-foreground">cm</span></p>
                          <DeltaBadge curr={v} prev={pv} lowerIsBetter={LOWER_IS_BETTER[k]} />
                        </div>
                        <p className="text-[10px] text-muted-foreground">{LABEL[k]}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* All other filled measurements (not in summary) */}
            {(() => {
              const extra = ALL_MEASUREMENT_KEYS.filter(
                (k) => !SUMMARY_KEYS.includes(k) && latest[k] != null,
              )
              if (extra.length === 0) return null
              return (
                <div className="flex flex-wrap gap-2">
                  {extra.map((k) => {
                    const v = latest[k]!
                    const pv = previous?.[k] ?? null
                    return (
                      <div key={k} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-100 text-xs">
                        <span className="text-muted-foreground">{LABEL[k]}</span>
                        <span className="font-semibold">{v.toFixed(1)}</span>
                        <DeltaBadge curr={v} prev={pv} lowerIsBetter={LOWER_IS_BETTER[k]} />
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

            {/* History */}
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
                              {formatDate(m.measured_at)}
                            </span>
                            {m.chest_cm   != null && <span className="text-foreground/70">Tórax {m.chest_cm}cm</span>}
                            {m.waist_cm   != null && <span className="text-foreground/70">Cintura {m.waist_cm}cm</span>}
                            {m.hip_cm     != null && <span className="text-foreground/70">Quadril {m.hip_cm}cm</span>}
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
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center">
                      <Ruler className="w-4.5 h-4.5 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold">Nova medição</h3>
                      <p className="text-xs text-muted-foreground">Circunferências corporais</p>
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
                  <label className="text-xs font-medium text-muted-foreground">Data da medição</label>
                  <input
                    type="date"
                    value={form.measured_at}
                    onChange={(e) => setField('measured_at', e.target.value)}
                    className="field text-sm"
                  />
                </div>

                {/* Groups */}
                <div className="space-y-5 mb-5">
                  {GROUPS.map((group) => (
                    <div key={group.label}>
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        {group.label}
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {group.fields.map(({ key, label }) => (
                          <MeasureInput
                            key={key}
                            id={key}
                            label={label}
                            value={form[key]}
                            onChange={(v) => setField(key, v)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Notes */}
                <div className="space-y-1.5 mb-6">
                  <label className="text-xs font-medium text-muted-foreground">Observações</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setField('notes', e.target.value)}
                    placeholder="Condições da medição, postura, horário..."
                    className="field text-sm resize-none"
                    rows={2}
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
                    disabled={saving}
                    className="btn-primary flex-1 py-3 rounded-xl text-sm font-semibold"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar medidas'}
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
