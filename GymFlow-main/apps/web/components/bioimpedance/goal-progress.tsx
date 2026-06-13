'use client'

import { motion } from 'framer-motion'
import { Target, Trophy, Flame, Sparkles } from 'lucide-react'

import { cn } from '@/lib/utils'

// Métricas que uma meta de bioimpedância pode acompanhar.
// `lowerIsBetter` só informa a UI; o cálculo de progresso usa start→target (direção implícita).
export const GOAL_METRICS = {
  weight_kg:      { label: 'Peso',           unit: 'kg',   lowerIsBetter: false },
  body_fat_pct:   { label: 'Gordura',        unit: '%',    lowerIsBetter: true  },
  muscle_mass_kg: { label: 'Massa Muscular', unit: 'kg',   lowerIsBetter: false },
  bmi:            { label: 'IMC',            unit: '',     lowerIsBetter: true  },
  visceral_fat:   { label: 'Gord. Visceral', unit: '',     lowerIsBetter: true  },
  body_water_pct: { label: 'Água Corporal',  unit: '%',    lowerIsBetter: false },
  metabolic_age:  { label: 'Idade Met.',     unit: 'anos', lowerIsBetter: true  },
} as const

export type GoalMetric = keyof typeof GOAL_METRICS

export interface BioGoal {
  metric: GoalMetric
  target_value: number
  start_value: number | null
}

// Progresso 0..1 do baseline (start) até o alvo (target). Direção implícita:
// (current - start) / (target - start) cobre perder E ganhar. null = sem como medir.
export function computeGoalProgress(goal: BioGoal, current: number | null): number | null {
  if (current == null || goal.start_value == null) return null
  const span = goal.target_value - goal.start_value
  if (span === 0) return current === goal.target_value ? 1 : 0
  const p = (current - goal.start_value) / span
  return Math.max(0, Math.min(1, p))
}

function fmt(n: number): string {
  return n % 1 === 0 ? String(n) : n.toFixed(1)
}

type Tier = 'unknown' | 'start' | 'half' | 'close' | 'done'

function tierOf(pct: number | null): Tier {
  if (pct == null) return 'unknown'
  if (pct >= 1) return 'done'
  if (pct >= 0.8) return 'close'
  if (pct >= 0.5) return 'half'
  return 'start'
}

const TIER_STYLE: Record<Tier, { bar: string; track: string; text: string; glow: string }> = {
  unknown: { bar: 'from-slate-500 to-slate-400',   track: 'bg-surface-200', text: 'text-muted-foreground', glow: '' },
  start:   { bar: 'from-brand-500 to-brand-400',   track: 'bg-surface-200', text: 'text-brand-300',  glow: 'rgba(99,102,241,0.45)'  },
  half:    { bar: 'from-cyan-500 to-cyan-400',     track: 'bg-surface-200', text: 'text-cyan-300',   glow: 'rgba(6,182,212,0.5)'    },
  close:   { bar: 'from-amber-500 to-amber-300',   track: 'bg-surface-200', text: 'text-amber-300',  glow: 'rgba(245,158,11,0.6)'   },
  done:    { bar: 'from-emerald-500 to-emerald-300', track: 'bg-surface-200', text: 'text-emerald-300', glow: 'rgba(16,185,129,0.7)' },
}

function message(tier: Tier, audience: 'student' | 'personal'): string {
  const self = audience === 'student'
  switch (tier) {
    case 'done':    return self ? 'Meta alcançada! Parabéns 🎉' : 'Aluno alcançou a meta 🎉'
    case 'close':   return self ? 'Quase lá! Falta pouco 🔥'    : 'Quase na meta — falta pouco 🔥'
    case 'half':    return self ? 'Você já passou da metade! 💪' : 'Passou da metade do caminho 💪'
    case 'start':   return self ? 'Bora! Cada avaliação te aproxima da meta.' : 'No início do caminho.'
    default:        return self ? 'Meta definida pelo seu personal.' : 'Aguardando 1ª avaliação pra medir o progresso.'
  }
}

export function GoalProgress({
  goal,
  current,
  audience = 'student',
}: {
  goal: BioGoal
  current: number | null
  audience?: 'student' | 'personal'
}) {
  const meta = GOAL_METRICS[goal.metric]
  const pct = computeGoalProgress(goal, current)
  const pctInt = pct == null ? null : Math.round(pct * 100)
  const tier = tierOf(pct)
  const style = TIER_STYLE[tier]
  const animated = tier === 'half' || tier === 'close' || tier === 'done'
  // Quanto mais perto da meta, mais rápido o pulso do brilho.
  const pulseDuration = tier === 'done' ? 0.8 : tier === 'close' ? 1.2 : 1.8

  return (
    <div
      className={cn(
        'rounded-2xl p-4 border transition-colors',
        tier === 'done'
          ? 'border-emerald-500/30 bg-emerald-500/5'
          : tier === 'close'
            ? 'border-amber-500/25 bg-amber-500/5'
            : 'border-brand-500/15 bg-brand-500/5'
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        {tier === 'done' ? (
          <motion.span
            animate={{ y: [0, -3, 0], rotate: [-6, 6, -6] }}
            transition={{ repeat: Infinity, duration: 1.1, ease: 'easeInOut' }}
          >
            <Trophy className="w-4 h-4 text-emerald-400" />
          </motion.span>
        ) : tier === 'close' ? (
          <Flame className="w-4 h-4 text-amber-400" />
        ) : (
          <Target className="w-4 h-4 text-brand-400" />
        )}
        <h4 className="font-display font-bold text-sm">
          {audience === 'student' ? 'Sua meta' : 'Meta do aluno'}
        </h4>
        <span className="ml-auto text-[11px] text-muted-foreground">
          {meta.label} · alvo {fmt(goal.target_value)}{meta.unit}
        </span>
      </div>

      {/* Números: atual → alvo */}
      <div className="flex items-end justify-between mb-2">
        <div>
          <p className="text-2xl font-display font-extrabold leading-none">
            {current != null ? fmt(current) : '—'}
            <span className="text-sm font-bold text-muted-foreground">{meta.unit}</span>
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">atual</p>
        </div>
        <div className="text-right">
          <p className={cn('text-lg font-display font-extrabold leading-none', style.text)}>
            {pctInt != null ? `${pctInt}%` : '—'}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            meta {fmt(goal.target_value)}{meta.unit}
          </p>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className={cn('relative h-3 rounded-full overflow-hidden', style.track)}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pctInt ?? 0}%` }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className={cn('absolute inset-y-0 left-0 rounded-full bg-gradient-to-r', style.bar)}
          style={animated && style.glow ? { boxShadow: `0 0 12px ${style.glow}` } : undefined}
        />
        {/* Brilho pulsante — só perto/na meta, acelera conforme aproxima */}
        {animated && (
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-white/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.5, 0], width: `${pctInt ?? 0}%` }}
            transition={{ repeat: Infinity, duration: pulseDuration, ease: 'easeInOut' }}
          />
        )}
      </div>

      {/* Mensagem motivacional por faixa */}
      <div className="flex items-center gap-1.5 mt-3">
        {tier === 'done' && (
          <motion.span
            animate={{ scale: [1, 1.3, 1], rotate: [0, 15, 0] }}
            transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          </motion.span>
        )}
        <p className={cn('text-xs font-semibold', style.text)}>{message(tier, audience)}</p>
      </div>
    </div>
  )
}
