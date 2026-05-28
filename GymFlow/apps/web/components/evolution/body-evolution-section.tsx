'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart, Area, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Activity, Ruler, Loader2, TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'

// ── Types ────────────────────────────────────────────────────
interface BioRow {
  assessed_at: string
  weight_kg: number | null
  body_fat_pct: number | null
  muscle_mass_kg: number | null
  bmi: number | null
  visceral_fat: number | null
  body_water_pct: number | null
}

interface MeasureRow {
  measured_at: string
  neck_cm: number | null; shoulder_cm: number | null; chest_cm: number | null
  waist_cm: number | null; abdomen_cm: number | null; hip_cm: number | null
  arm_right_cm: number | null; arm_left_cm: number | null
  forearm_right_cm: number | null; forearm_left_cm: number | null
  thigh_right_cm: number | null; thigh_left_cm: number | null
  calf_right_cm: number | null; calf_left_cm: number | null
}

type BioKey = Exclude<keyof BioRow, 'assessed_at'>
type MeasureKey = Exclude<keyof MeasureRow, 'measured_at'>

// ── Constants ────────────────────────────────────────────────
const PERIODS = [
  { key: '1m', label: '1M', days: 30   },
  { key: '3m', label: '3M', days: 90   },
  { key: '6m', label: '6M', days: 180  },
  { key: 'all', label: 'Tudo', days: 0 },
] as const
type Period = typeof PERIODS[number]['key']

const BIO_TABS: { key: BioKey; label: string; unit: string; color: string; lowerIsBetter?: boolean }[] = [
  { key: 'weight_kg',      label: 'Peso',      unit: 'kg',  color: '#1D9E75'  },
  { key: 'body_fat_pct',   label: 'Gordura',   unit: '%',   color: '#EF9F27', lowerIsBetter: true },
  { key: 'muscle_mass_kg', label: 'Músculo',   unit: 'kg',  color: '#10B981'  },
  { key: 'bmi',            label: 'IMC',       unit: '',    color: '#06B6D4'  },
]

const MEASURE_CARDS: { key: MeasureKey; label: string; lowerIsBetter?: boolean }[] = [
  { key: 'waist_cm',        label: 'Cintura',       lowerIsBetter: true  },
  { key: 'abdomen_cm',      label: 'Abdômen',       lowerIsBetter: true  },
  { key: 'hip_cm',          label: 'Quadril'                              },
  { key: 'chest_cm',        label: 'Tórax'                                },
  { key: 'thigh_right_cm',  label: 'Coxa D'                               },
  { key: 'arm_right_cm',    label: 'Braço D'                              },
  { key: 'calf_right_cm',   label: 'Panturrilha D'                        },
  { key: 'shoulder_cm',     label: 'Ombro'                                },
  { key: 'neck_cm',         label: 'Pescoço',       lowerIsBetter: true  },
  { key: 'arm_left_cm',     label: 'Braço E'                              },
  { key: 'forearm_right_cm',label: 'Antebraço D'                          },
  { key: 'thigh_left_cm',   label: 'Coxa E'                               },
  { key: 'calf_left_cm',    label: 'Panturrilha E'                        },
  { key: 'forearm_left_cm', label: 'Antebraço E'                          },
]

const RING_COLORS = {
  fat:    '#EF9F27',
  muscle: '#10B981',
  water:  '#3B82F6',
  other:  '#1E293B',
}

// ── Helpers ──────────────────────────────────────────────────
function fmtDate(d: string) {
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y?.slice(2)}`
}

function filterByPeriod<T>(
  rows: T[],
  dateKey: keyof T,
  period: Period,
): T[] {
  if (period === 'all') return rows
  const cutoff = new Date(Date.now() - PERIODS.find((p) => p.key === period)!.days * 86400000)
  return rows.filter((r) => new Date(r[dateKey] as unknown as string) >= cutoff)
}

function diffLabel(first: number, last: number, unit: string, lowerIsBetter = false) {
  const d = last - first
  if (Math.abs(d) < 0.05) return { text: '→ sem alteração', good: null }
  const up = d > 0
  const good = lowerIsBetter ? !up : up
  return { text: `${up ? '+' : ''}${d.toFixed(1)}${unit}`, good }
}

// ── Shared tooltip ────────────────────────────────────────────
function ChartTip({ active, payload, label, unit = '' }: {
  active?: boolean; payload?: Array<{ value: number; color?: string }>; label?: string; unit?: string
}) {
  if (!active || !payload?.length) return null
  const v = payload[0]?.value
  const c = payload[0]?.color ?? '#1D9E75'
  return (
    <div className="glass rounded-xl px-3 py-2 border border-border/60 shadow-xl text-xs">
      <p className="text-muted-foreground mb-0.5">{label}</p>
      <p className="font-bold text-sm" style={{ color: c }}>{v?.toFixed(1)}{unit}</p>
    </div>
  )
}

// ── Sparkline ─────────────────────────────────────────────────
function Sparkline({ data, dataKey, color }: { data: object[]; dataKey: string; color: string }) {
  if (data.length < 2) return <div className="h-10" />
  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ── Body composition ring ─────────────────────────────────────
function CompositionRing({ latest }: { latest: BioRow }) {
  const { weight_kg, body_fat_pct, muscle_mass_kg, body_water_pct } = latest

  if (!weight_kg || (!body_fat_pct && !muscle_mass_kg)) return null

  const fatPct   = body_fat_pct ?? 0
  const musPct   = muscle_mass_kg ? Math.round((muscle_mass_kg / weight_kg) * 100) : 0
  const waterPct = body_water_pct ?? 0
  const other    = Math.max(0, 100 - fatPct - musPct - waterPct)

  const slices = [
    { name: 'Gordura', value: fatPct,   fill: RING_COLORS.fat    },
    { name: 'Músculo', value: musPct,   fill: RING_COLORS.muscle },
    { name: 'Água',    value: waterPct, fill: RING_COLORS.water  },
    { name: 'Outro',   value: other,    fill: RING_COLORS.other  },
  ].filter((s) => s.value > 0)

  return (
    <div className="glass rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-5">
      {/* Ring */}
      <div className="relative flex-shrink-0">
        <ResponsiveContainer width={120} height={120}>
          <PieChart>
            <Pie
              data={slices}
              cx="50%" cy="50%"
              innerRadius={40} outerRadius={56}
              startAngle={90} endAngle={-270}
              dataKey="value"
              stroke="none"
            >
              {slices.map((s) => <Cell key={s.name} fill={s.fill} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="font-display font-bold text-lg leading-none">{weight_kg.toFixed(1)}</p>
          <p className="text-[10px] text-muted-foreground">kg</p>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 flex-1">
        {[
          { label: 'Gordura',  val: fatPct,   unit: '%',  fill: RING_COLORS.fat    },
          { label: 'Músculo',  val: musPct,   unit: '%',  fill: RING_COLORS.muscle },
          { label: 'Água',     val: waterPct, unit: '%',  fill: RING_COLORS.water  },
          { label: 'Peso',     val: weight_kg,unit: 'kg', fill: '#1D9E75'           },
        ].filter((l) => l.val > 0).map(({ label, val, unit, fill }) => (
          <div key={label} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: fill }} />
            <div>
              <p className="text-xs font-semibold">{val.toFixed(1)}{unit}</p>
              <p className="text-[10px] text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Measurement card ──────────────────────────────────────────
function MeasureCard({
  label, current, sparkData, dataKey, selected, lowerIsBetter, first, onClick,
}: {
  label: string
  current: number
  sparkData: object[]
  dataKey: string
  selected: boolean
  lowerIsBetter?: boolean
  first: number
  onClick: () => void
}) {
  const { text, good } = diffLabel(first, current, 'cm', lowerIsBetter)
  const sparkColor = good === true ? '#10B981' : good === false ? '#EF4444' : '#64748B'

  return (
    <button
      onClick={onClick}
      className={cn(
        'text-left p-3.5 rounded-2xl border transition-all duration-200 space-y-1',
        selected
          ? 'bg-brand-500/10 border-brand-500/30 shadow-glow-sm'
          : 'glass border-border/40 hover:border-brand-500/20 hover:-translate-y-0.5 hover:shadow-card-hover',
      )}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-display font-bold text-xl leading-none">
        {current.toFixed(1)}<span className="text-xs font-normal text-muted-foreground ml-0.5">cm</span>
      </p>
      <div className={cn(
        'inline-flex items-center gap-1 text-[10px] font-semibold',
        good === true ? 'text-emerald-400' : good === false ? 'text-red-400' : 'text-muted-foreground',
      )}>
        {good === true ? <TrendingDown className="w-3 h-3" /> : good === false ? <TrendingUp className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
        {text}
      </div>
      <Sparkline data={sparkData} dataKey={dataKey} color={sparkColor} />
    </button>
  )
}

// ── Main ─────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.35, ease: [0.16, 1, 0.3, 1] } }),
}

export function BodyEvolutionSection() {
  const supabase = createClient()
  const { currentAcademy, profile } = useAuthStore()

  const [bioRows, setBioRows]       = useState<BioRow[]>([])
  const [measRows, setMeasRows]     = useState<MeasureRow[]>([])
  const [loading, setLoading]       = useState(true)
  const [period, setPeriod]         = useState<Period>('all')
  const [activeBioKey, setActiveBioKey]     = useState<BioKey>('weight_kg')
  const [activeMeasKey, setActiveMeasKey]   = useState<MeasureKey | null>(null)

  const load = useCallback(async () => {
    if (!currentAcademy || !profile) { setLoading(false); return }
    setLoading(true)
    const [b, m] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from('bioimpedance_assessments')
        .select('assessed_at,weight_kg,body_fat_pct,muscle_mass_kg,bmi,visceral_fat,body_water_pct')
        .eq('academy_id', currentAcademy.id).eq('student_id', profile.id)
        .order('assessed_at', { ascending: true }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from('body_measurements')
        .select('measured_at,neck_cm,shoulder_cm,chest_cm,waist_cm,abdomen_cm,hip_cm,arm_right_cm,arm_left_cm,forearm_right_cm,forearm_left_cm,thigh_right_cm,thigh_left_cm,calf_right_cm,calf_left_cm')
        .eq('academy_id', currentAcademy.id).eq('student_id', profile.id)
        .order('measured_at', { ascending: true }),
    ])
    setBioRows(b.data ?? [])
    setMeasRows(m.data ?? [])
    setLoading(false)
  }, [currentAcademy, profile])

  useEffect(() => { void load() }, [load])

  // ── Filtered data ────────────────────────────────────────────
  const bio   = useMemo(() => filterByPeriod(bioRows,  'assessed_at', period), [bioRows,  period])
  const meas  = useMemo(() => filterByPeriod(measRows, 'measured_at', period), [measRows, period])

  // ── Bio chart data ───────────────────────────────────────────
  const bioOpt   = BIO_TABS.find((t) => t.key === activeBioKey)!
  const bioChart = bio
    .filter((r) => r[activeBioKey] != null)
    .map((r) => ({ date: fmtDate(r.assessed_at), value: r[activeBioKey] as number }))

  const bioFirst = bioChart[0]?.value
  const bioLast  = bioChart.at(-1)?.value

  // ── Active measure cards ─────────────────────────────────────
  const availCards = useMemo(() =>
    MEASURE_CARDS.filter(({ key }) => meas.filter((r) => r[key] != null).length >= 1),
  [meas])

  // auto-select first card
  useEffect(() => {
    if (availCards.length > 0 && (activeMeasKey === null || !availCards.find((c) => c.key === activeMeasKey))) {
      setActiveMeasKey(availCards[0]!.key)
    }
  }, [availCards])

  // ── Measure chart ────────────────────────────────────────────
  const measOpt   = MEASURE_CARDS.find((c) => c.key === activeMeasKey)
  const measChart = activeMeasKey
    ? meas.filter((r) => r[activeMeasKey] != null)
        .map((r) => ({ date: fmtDate(r.measured_at), value: r[activeMeasKey] as number }))
    : []

  const measFirst = measChart[0]?.value
  const measLast  = measChart.at(-1)?.value

  const noBio  = bioRows.length === 0
  const noMeas = measRows.length === 0

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
      </div>
    )
  }

  if (noBio && noMeas) {
    return (
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show" className="text-center py-20">
        <div className="w-14 h-14 rounded-2xl bg-surface-200 flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="w-7 h-7 text-muted-foreground/40" />
        </div>
        <p className="font-semibold text-muted-foreground">Nenhuma avaliação ainda</p>
        <p className="text-sm text-muted-foreground/60 mt-1 max-w-xs mx-auto">
          Seu personal trainer precisa registrar avaliações de bioimpedância ou medidas corporais para você ver sua evolução aqui.
        </p>
      </motion.div>
    )
  }

  const latestBio = bio.at(-1) ?? null

  return (
    <div className="space-y-6">

      {/* ── Period selector ── */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show"
        className="flex gap-1 p-1 glass rounded-xl w-fit border border-border/40"
      >
        {PERIODS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setPeriod(key)}
            className={cn(
              'px-4 py-1.5 rounded-lg text-xs font-semibold transition-all',
              period === key
                ? 'bg-brand-500/20 text-brand-300 border border-brand-500/25'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {label}
          </button>
        ))}
      </motion.div>

      {/* ══════════════════════════════════
          COMPOSIÇÃO CORPORAL
      ══════════════════════════════════ */}
      {!noBio && (
        <div className="space-y-4">
          <motion.p custom={1} variants={fadeUp} initial="hidden" animate="show"
            className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2"
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            Composição Corporal
          </motion.p>

          {/* Ring + legend */}
          {latestBio && (
            <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show">
              <CompositionRing latest={latestBio} />
            </motion.div>
          )}

          {/* Metric tab pills */}
          <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show"
            className="flex gap-2 flex-wrap"
          >
            {BIO_TABS.filter(({ key }) => bio.some((r) => r[key] != null)).map(({ key, label, color }) => (
              <button
                key={key}
                onClick={() => setActiveBioKey(key)}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all',
                  activeBioKey === key
                    ? 'text-white border-transparent'
                    : 'glass border-border/40 text-muted-foreground hover:text-foreground',
                )}
                style={activeBioKey === key ? { background: color } : undefined}
              >
                {label}
              </button>
            ))}
          </motion.div>

          {/* Bio chart card */}
          <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show"
            className="glass rounded-2xl p-5"
          >
            {/* Hero number */}
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">{bioOpt.label}</p>
                {bioLast !== undefined ? (
                  <p className="font-display font-bold text-3xl leading-none" style={{ color: bioOpt.color }}>
                    {bioLast.toFixed(1)}
                    <span className="text-base font-normal text-muted-foreground ml-1">{bioOpt.unit}</span>
                  </p>
                ) : (
                  <p className="text-muted-foreground text-sm">Sem dados no período</p>
                )}
              </div>
              {bioFirst !== undefined && bioLast !== undefined && (() => {
                const { text, good } = diffLabel(bioFirst, bioLast, bioOpt.unit, bioOpt.lowerIsBetter)
                return (
                  <span className={cn(
                    'flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full',
                    good === true  ? 'bg-emerald-500/15 text-emerald-400' :
                    good === false ? 'bg-red-500/15 text-red-400' :
                    'bg-surface-200 text-muted-foreground',
                  )}>
                    {good === true ? <TrendingDown className="w-3 h-3" /> : good === false ? <TrendingUp className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                    {text}
                  </span>
                )
              })()}
            </div>

            {bioChart.length < 2 ? (
              <div className="flex items-center justify-center py-10 rounded-xl bg-surface-100 border border-dashed border-border/40">
                <p className="text-xs text-muted-foreground">Registre mais avaliações para ver a evolução</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={bioChart} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id={`grad-${activeBioKey}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={bioOpt.color} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={bioOpt.color} stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => `${v}${bioOpt.unit}`} domain={['auto', 'auto']} />
                  <Tooltip content={<ChartTip unit={bioOpt.unit} />} />
                  <Area
                    type="monotone" dataKey="value"
                    stroke={bioOpt.color} strokeWidth={2.5}
                    fill={`url(#grad-${activeBioKey})`}
                    dot={{ fill: bioOpt.color, strokeWidth: 0, r: 3.5 }}
                    activeDot={{ fill: bioOpt.color, r: 6, strokeWidth: 2, stroke: '#0F172A' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </motion.div>
        </div>
      )}

      {/* ══════════════════════════════════
          MEDIDAS CORPORAIS
      ══════════════════════════════════ */}
      {!noMeas && availCards.length > 0 && (
        <div className="space-y-4">
          <motion.p custom={5} variants={fadeUp} initial="hidden" animate="show"
            className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2"
          >
            <Ruler className="w-3.5 h-3.5 text-indigo-400" />
            Medidas Corporais
          </motion.p>

          {/* Cards grid */}
          <motion.div custom={6} variants={fadeUp} initial="hidden" animate="show"
            className="grid grid-cols-2 sm:grid-cols-3 gap-3"
          >
            {availCards.map(({ key, label, lowerIsBetter }) => {
              const pts = meas.filter((r) => r[key] != null)
              const current = pts.at(-1)?.[key] as number
              const first   = pts[0]?.[key] as number
              const sparkData = pts.map((r) => ({ date: fmtDate(r.measured_at), [key]: r[key] }))
              return (
                <MeasureCard
                  key={key}
                  label={label}
                  current={current}
                  first={first}
                  sparkData={sparkData}
                  dataKey={key}
                  selected={activeMeasKey === key}
                  lowerIsBetter={lowerIsBetter}
                  onClick={() => setActiveMeasKey(key)}
                />
              )
            })}
          </motion.div>

          {/* Expanded chart for selected measure */}
          <AnimatePresence mode="wait">
            {activeMeasKey && measOpt && measChart.length >= 2 && (
              <motion.div
                key={activeMeasKey}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="glass rounded-2xl p-5"
              >
                {/* Hero */}
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">{measOpt.label}</p>
                    <p className="font-display font-bold text-3xl leading-none text-indigo-400">
                      {measLast?.toFixed(1)}
                      <span className="text-base font-normal text-muted-foreground ml-1">cm</span>
                    </p>
                  </div>
                  {measFirst !== undefined && measLast !== undefined && (() => {
                    const { text, good } = diffLabel(measFirst, measLast, 'cm', measOpt.lowerIsBetter)
                    return (
                      <span className={cn(
                        'flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full',
                        good === true  ? 'bg-emerald-500/15 text-emerald-400' :
                        good === false ? 'bg-red-500/15 text-red-400' :
                        'bg-surface-200 text-muted-foreground',
                      )}>
                        {good === true ? <TrendingDown className="w-3 h-3" /> : good === false ? <TrendingUp className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                        {text}
                      </span>
                    )
                  })()}
                </div>

                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={measChart} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="grad-meas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#6366F1" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0}    />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false}
                      tickFormatter={(v) => `${v}cm`} domain={['auto', 'auto']} />
                    <Tooltip content={<ChartTip unit="cm" />} />
                    <Area
                      type="monotone" dataKey="value"
                      stroke="#6366F1" strokeWidth={2.5}
                      fill="url(#grad-meas)"
                      dot={{ fill: '#6366F1', strokeWidth: 0, r: 3.5 }}
                      activeDot={{ fill: '#818CF8', r: 6, strokeWidth: 2, stroke: '#0F172A' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>

                {/* Footer: start → end */}
                {measFirst !== undefined && measLast !== undefined && (
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30 text-xs text-muted-foreground">
                    <span>Início: <span className="text-foreground font-semibold">{measFirst.toFixed(1)} cm</span></span>
                    <span className="text-border/60">·</span>
                    <span>Atual: <span className="text-foreground font-semibold">{measLast.toFixed(1)} cm</span></span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
