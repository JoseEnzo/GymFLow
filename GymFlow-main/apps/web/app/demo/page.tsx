'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dumbbell, Users, TrendingUp, Activity, Clock, Check,
  ArrowRight, ChevronLeft, Play, BarChart2, Zap, Target,
  Star, Award, Plus, ChevronRight, Bell, Settings, X, Lock,
} from 'lucide-react'
import { BrandLogo } from '@/components/layout/brand-logo'
import { cn } from '@/lib/utils'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
}
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

// ── Dados mock ──────────────────────────────────────────────
const MOCK_STUDENTS = [
  { name: 'Lucas Mendes', plan: 'Treino A', progress: 82, lastSeen: 'Hoje' },
  { name: 'Ana Paula', plan: 'Treino B', progress: 65, lastSeen: 'Ontem' },
  { name: 'Rafael Costa', plan: 'Treino C', progress: 91, lastSeen: 'Hoje' },
  { name: 'Juliana Lopes', plan: 'Treino A', progress: 47, lastSeen: '3 dias' },
]

const MOCK_EXERCISES = [
  { name: 'Supino Reto', sets: '4×10', weight: '80 kg', done: true },
  { name: 'Crucifixo Inclinado', sets: '3×12', weight: '22 kg', done: true },
  { name: 'Tríceps Corda', sets: '4×15', weight: '30 kg', done: false },
  { name: 'Tríceps Testa', sets: '3×12', weight: '25 kg', done: false },
]

const MOCK_STATS = [
  { label: 'Alunos ativos', value: '247', color: '#6366F1', icon: Users },
  { label: 'Treinos hoje', value: '38', color: '#10B981', icon: Activity },
  { label: 'Frequência', value: '91%', color: '#06B6D4', icon: TrendingUp },
  { label: 'Satisfação', value: '98%', color: '#F59E0B', icon: Star },
]

const WEEKLY = [65, 80, 45, 90, 70, 85, 60]

// ── Gate modal ───────────────────────────────────────────────
function GateModal({
  message,
  onClose,
}: {
  message: string
  onClose: () => void
}) {
  const router = useRouter()

  const go = (href: string) => {
    onClose()
    router.push(href)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-sm glass rounded-3xl p-7 text-center"
          style={{ border: '1px solid rgba(99,102,241,0.3)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-100 transition-all"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-brand-500/15 border border-brand-500/25">
            <Lock className="w-5 h-5 text-brand-400" />
          </div>

          <h3 className="font-display font-bold text-lg mb-2">Recurso exclusivo</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">{message}</p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => go('/cadastro')}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-sm"
              style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)' }}
            >
              Criar conta gratuita
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => go('/login')}
              className="w-full py-3 rounded-xl font-semibold text-sm text-muted-foreground hover:text-foreground border border-border/60 hover:bg-surface-100 transition-all"
            >
              Já tenho conta — entrar
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ── Views por perfil ─────────────────────────────────────────
function OwnerView({ onAction }: { onAction: (msg: string) => void }) {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
      {/* Stats */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {MOCK_STATS.map(({ label, value, color, icon: Icon }) => (
          <div
            key={label}
            className="glass rounded-2xl p-4"
            style={{ border: `1px solid ${color}25` }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-4 h-4" style={{ color }} />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
            <p className="text-2xl font-display font-extrabold" style={{ color }}>{value}</p>
          </div>
        ))}
      </motion.div>

      {/* Chart + list */}
      <div className="grid md:grid-cols-5 gap-4">
        <motion.div variants={fadeUp} className="glass rounded-2xl p-5 md:col-span-3">
          <p className="text-sm font-semibold mb-4">Atividade semanal</p>
          <div className="flex items-end gap-2 h-24">
            {WEEKLY.map((h, i) => (
              <motion.div
                key={i}
                className="flex-1 rounded-md"
                style={{ background: 'linear-gradient(to top, #6366F1, #818CF8)' }}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ delay: 0.4 + i * 0.07, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              />
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-2">
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(d => <span key={d}>{d}</span>)}
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="glass rounded-2xl p-5 md:col-span-2 flex flex-col gap-3">
          <p className="text-sm font-semibold">Plano atual</p>
          <div className="rounded-xl p-3 bg-brand-500/10 border border-brand-500/20">
            <div className="flex items-center justify-between mb-1">
              <span className="font-display font-bold text-brand-400">Starter</span>
              <span className="text-xs text-muted-foreground">R$ 99/mês</span>
            </div>
            <div className="text-xs text-muted-foreground mb-2">247 / 300 alunos</div>
            <div className="h-1.5 bg-surface-200 rounded-full overflow-hidden">
              <div className="h-full bg-brand-500 rounded-full" style={{ width: '82%' }} />
            </div>
          </div>
          <button
            onClick={() => onAction('Faça upgrade para o plano Pro e gerencie alunos ilimitados com relatórios avançados.')}
            className="btn-primary text-xs py-2.5 rounded-xl text-center font-bold w-full"
          >
            Fazer upgrade → Pro
          </button>
        </motion.div>
      </div>
    </motion.div>
  )
}

function PersonalView({ onAction }: { onAction: (msg: string) => void }) {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <p className="text-sm font-semibold">Meus alunos (4)</p>
        <button
          onClick={() => onAction('Crie sua conta para convidar alunos e gerenciar sua turma completa.')}
          className="inline-flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Convidar aluno
        </button>
      </motion.div>

      <div className="space-y-3">
        {MOCK_STUDENTS.map((s, i) => (
          <motion.div
            key={s.name}
            variants={fadeUp}
            transition={{ delay: i * 0.07 }}
            onClick={() => onAction(`Crie sua conta para ver o perfil completo de ${s.name}, histórico de treinos e evolução de carga.`)}
            className="glass rounded-2xl p-4 flex items-center gap-4 hover:border-brand-500/20 transition-all duration-200 cursor-pointer group"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{ background: `linear-gradient(135deg, #6366F1, #4F46E5)` }}
            >
              {s.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold text-sm truncate">{s.name}</p>
                <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">{s.lastSeen}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-surface-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-500 to-cyan-500"
                    style={{ width: `${s.progress}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0">{s.progress}%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{s.plan}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

function StudentView({ onAction }: { onAction: (msg: string) => void }) {
  const completed = [0, 1]

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
      {/* Workout header */}
      <motion.div variants={fadeUp} className="glass rounded-2xl p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <span className="badge-primary text-xs mb-1 inline-block">Hoje</span>
            <h3 className="font-display font-bold text-lg">Treino A — Peito e Tríceps</h3>
            <p className="text-xs text-muted-foreground mt-0.5">4 exercícios · ~55 min</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-cyan-400">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-mono font-bold">12:34</span>
          </div>
        </div>
        <div className="h-2 bg-surface-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-brand-500 to-cyan-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(completed.length / MOCK_EXERCISES.length) * 100}%` }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          {completed.length}/{MOCK_EXERCISES.length} exercícios concluídos
        </p>
      </motion.div>

      {/* Exercise list */}
      <div className="space-y-3">
        {MOCK_EXERCISES.map((ex, i) => {
          const done = completed.includes(i)
          return (
            <motion.div
              key={ex.name}
              variants={fadeUp}
              transition={{ delay: i * 0.07 }}
              onClick={() => onAction('Crie sua conta para registrar séries, peso e evolução de carga de cada exercício.')}
              className={cn(
                'glass rounded-2xl p-4 flex items-center gap-4 cursor-pointer transition-all duration-200',
                done ? 'border-emerald-500/30 bg-emerald-500/5' : 'hover:border-brand-500/20'
              )}
            >
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200',
                done ? 'bg-emerald-500' : 'bg-surface-200 border border-border/60'
              )}>
                {done && <Check className="w-4 h-4 text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('font-semibold text-sm', done && 'line-through text-muted-foreground')}>
                  {ex.name}
                </p>
                <p className="text-xs text-muted-foreground">{ex.sets} · {ex.weight}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onAction('Crie sua conta para iniciar treinos, registrar séries e acompanhar sua evolução.') }}
                className={cn(
                  'text-xs px-3 py-1.5 rounded-lg font-medium transition-all',
                  done
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-brand-500/15 text-brand-400 hover:bg-brand-500/25'
                )}
              >
                {done ? 'Feito' : 'Iniciar'}
              </button>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ── Tabs ─────────────────────────────────────────────────────
const TABS = [
  {
    id: 'owner',
    label: 'Proprietário',
    emoji: '🏢',
    color: '#6366F1',
    headline: 'Painel do gestor',
    subtitle: 'Veja métricas, gerencie o plano e acompanhe a academia em tempo real.',
    View: OwnerView,
  },
  {
    id: 'personal',
    label: 'Personal',
    emoji: '💪',
    color: '#06B6D4',
    headline: 'Gestão de alunos',
    subtitle: 'Acompanhe o progresso de cada aluno e monte fichas personalizadas.',
    View: PersonalView,
  },
  {
    id: 'student',
    label: 'Aluno',
    emoji: '🎯',
    color: '#10B981',
    headline: 'Execução de treino',
    subtitle: 'Interface do aluno — registre séries e acompanhe sua evolução.',
    View: StudentView,
  },
]

// ── Page ─────────────────────────────────────────────────────
export default function DemoPage() {
  const [active, setActive] = useState(0)
  const [gate, setGate] = useState<string | null>(null)
  const tab = TABS[active]!

  const openGate = (msg: string) => setGate(msg)

  return (
    <div className="relative min-h-screen bg-background bg-mesh bg-fixed">
      {/* Grid pattern — absolute, rola junto com a página */}
      <div
        className="absolute inset-0 pointer-events-none z-0 opacity-[0.04]"
        aria-hidden="true"
        style={{
          backgroundImage: `linear-gradient(rgba(99,102,241,1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(99,102,241,1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />
      {/* Vignette — fixed viewport overlay, below nav (z-50) */}
      <div
        className="fixed inset-0 pointer-events-none z-[45]"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 80% 75% at 50% 50%, transparent 45%, rgba(0,0,0,0.55) 100%)',
        }}
      />
      {gate && <GateModal message={gate} onClose={() => setGate(null)} />}

      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/60">
        <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="w-4 h-4" />
              Voltar
            </Link>
            <span className="text-border/60">|</span>
            <BrandLogo size="sm" />

          </div>

          <div className="flex items-center gap-2">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5">
              Entrar
            </Link>
            <Link href="/cadastro" className="btn-primary text-xs px-4 py-2 rounded-lg">
              Começar grátis
            </Link>
          </div>
        </div>
      </div>

      <div className="relative pt-14">
        {/* Hero da demo */}
        <div className="relative py-16 overflow-hidden">
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)' }}
          />

          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="relative mx-auto max-w-5xl px-4 text-center"
          >
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold mb-6">
                <Play className="w-3 h-3" />
                Prévia interativa
              </span>
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl font-display font-extrabold tracking-tight mb-4">
              Explore o MeuTrein
              <span className="block gradient-text">antes de se cadastrar</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="text-muted-foreground text-lg max-w-xl mx-auto">
              Veja como a plataforma funciona para cada perfil. Clique nas abas abaixo e interaja com a interface real.
            </motion.p>
          </motion.div>
        </div>

        {/* Tab selector */}
        <div className="mx-auto max-w-5xl px-4 mb-8">
          <div className="flex justify-center">
            <div className="inline-flex p-1 rounded-2xl bg-surface-100 border border-border/60">
              {TABS.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => setActive(i)}
                  className={cn(
                    'px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
                    active === i
                      ? 'bg-card text-foreground shadow-md border border-border/60'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Demo panel */}
        <div className="mx-auto max-w-5xl px-4 pb-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Panel header */}
              <div
                className="glass rounded-t-3xl px-6 py-4 flex items-center justify-between border-b border-border/40"
                style={{ borderTop: `2px solid ${tab.color}40` }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{tab.emoji}</span>
                  <div>
                    <p className="font-display font-bold">{tab.headline}</p>
                    <p className="text-xs text-muted-foreground">{tab.subtitle}</p>
                  </div>
                </div>
                {/* Fake window controls */}
                <div className="hidden sm:flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
              </div>

              {/* Panel body */}
              <div className="glass rounded-b-3xl p-6">
                <tab.View onAction={openGate} />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* CTA section */}
        <div>
          <div className="mx-auto max-w-5xl px-4 py-16">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center space-y-6"
            >
              <h2 className="text-3xl sm:text-4xl font-display font-extrabold">
                Gostou do que viu?
                <span className="block gradient-text">Comece grátis agora.</span>
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Sem cartão de crédito. Sem fidelidade. Configure sua academia em menos de 5 minutos.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                <Link
                  href="/cadastro"
                  className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-white text-base"
                  style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)' }}
                >
                  Criar conta gratuita
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-muted-foreground hover:text-foreground border border-border/60 hover:border-border hover:bg-surface-100 transition-all duration-200"
                >
                  Já tenho conta
                </Link>
              </div>

              {/* Feature bullets */}
              <div className="flex flex-wrap justify-center gap-4 pt-4">
                {[
                  '30 alunos grátis',
                  'PWA mobile',
                  'Fichas ilimitadas',
                  'Sem fidelidade',
                ].map(item => (
                  <div key={item} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    {item}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
