'use client'

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import { useRef, useState, useEffect } from 'react'
import {
  Dumbbell, Users, TrendingUp, Shield, Zap, BarChart2,
  ChevronRight, Check, Star, ArrowRight, Play, Menu, X,
  Smartphone, Clock, Award, Target, Activity, Lock,
  ChevronDown, Quote,
} from 'lucide-react'

import { cn } from '@/lib/utils'

// ──────────────────────────────────────────────
// Animation variants
// ──────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.94 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
}

// ──────────────────────────────────────────────
// Animated counter
// ──────────────────────────────────────────────
function Counter({ end, suffix = '' }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry?.isIntersecting) setStarted(true) },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!started) return
    const duration = 1800
    const step = Math.ceil(end / (duration / 16))
    const timer = setInterval(() => {
      setCount((c) => {
        const next = c + step
        if (next >= end) { clearInterval(timer); return end }
        return next
      })
    }, 16)
    return () => clearInterval(timer)
  }, [started, end])

  return (
    <span ref={ref} className="tabular-nums">
      {count.toLocaleString('pt-BR')}{suffix}
    </span>
  )
}

// ──────────────────────────────────────────────
// Floating mock card
// ──────────────────────────────────────────────
function FloatingCard({
  className,
  delay = 0,
  children,
}: {
  className?: string
  delay?: number
  children: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{ animationDelay: `${delay}s` }}
      className={cn(
        'glass rounded-2xl p-4 shadow-card-hover border border-brand-500/10',
        'animate-float',
        className
      )}
    >
      {children}
    </motion.div>
  )
}

// ──────────────────────────────────────────────
// Particle field — CSS-only, GPU-accelerated
// Positions are static (SSR-safe, no randomness)
// Hidden via CSS when prefers-reduced-motion: reduce
// ──────────────────────────────────────────────
const PARTICLES = [
  { left: '6%',  top: '15%', w: 7,  color: '#6366F1', td: '14s', tt: '3.5s', d: '0s'   },
  { left: '90%', top: '10%', w: 5,  color: '#06B6D4', td: '11s', tt: '4s',   d: '2.5s' },
  { left: '20%', top: '76%', w: 9,  color: '#6366F1', td: '16s', tt: '5s',   d: '5s'   },
  { left: '74%', top: '55%', w: 5,  color: '#10B981', td: '13s', tt: '3s',   d: '1s'   },
  { left: '46%', top: '22%', w: 6,  color: '#06B6D4', td: '10s', tt: '4.5s', d: '7s'   },
  { left: '88%', top: '80%', w: 5,  color: '#818CF8', td: '17s', tt: '2.5s', d: '3.5s' },
  { left: '12%', top: '88%', w: 6,  color: '#F59E0B', td: '12s', tt: '6s',   d: '8s'   },
  { left: '62%', top: '90%', w: 4,  color: '#22D3EE', td: '9s',  tt: '3s',   d: '4.5s' },
  { left: '32%', top: '48%', w: 4,  color: '#8B5CF6', td: '15s', tt: '4s',   d: '6s'   },
  { left: '70%', top: '28%', w: 6,  color: '#6366F1', td: '18s', tt: '5s',   d: '1.5s' },
  { left: '26%', top: '33%', w: 4,  color: '#10B981', td: '11s', tt: '3.5s', d: '9s'   },
  { left: '82%', top: '62%', w: 7,  color: '#06B6D4', td: '13s', tt: '4.5s', d: '2s'   },
]

function ParticleField({ count = 8, className = '' }: { count?: number; className?: string }) {
  return (
    <div
      className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}
      aria-hidden="true"
    >
      {PARTICLES.slice(0, count).map((p, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: p.left,
            top: p.top,
            animation: `particle-drift ${p.td} ease-in-out ${p.d} infinite`,
          }}
        >
          <span
            className="block rounded-full"
            style={{
              width: p.w,
              height: p.w,
              background: p.color,
              boxShadow: `0 0 ${p.w * 2}px ${p.color}, 0 0 ${p.w * 5}px ${p.color}55`,
              animation: `particle-twinkle ${p.tt} ease-in-out ${p.d} infinite`,
            }}
          />
        </div>
      ))}
    </div>
  )
}

// ──────────────────────────────────────────────
// Section transition divider
// ──────────────────────────────────────────────
function SectionTransition() {
  return (
    <div className="relative h-12 flex items-center justify-center" aria-hidden="true">
      {/* Linha que se desenha */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] overflow-hidden">
        <motion.div
          className="h-full origin-left"
          style={{
            background: 'linear-gradient(to right, transparent 0%, rgba(99,102,241,0.9) 30%, rgba(6,182,212,0.8) 70%, transparent 100%)',
            boxShadow: '0 0 12px rgba(99,102,241,0.6), 0 0 24px rgba(99,102,241,0.3)',
          }}
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      {/* Ponto central com glow */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-4 h-4 rounded-full"
        style={{
          background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
          boxShadow: '0 0 16px rgba(99,102,241,0.9), 0 0 32px rgba(99,102,241,0.5), 0 0 48px rgba(6,182,212,0.3)',
        }}
      />
    </div>
  )
}

// ──────────────────────────────────────────────
// Nav
// ──────────────────────────────────────────────
function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-background/80 backdrop-blur-xl border-b border-border/60 shadow-2xl'
          : 'bg-transparent'
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="relative flex items-center justify-center w-8 h-8">
              <div className="absolute inset-0 rounded-lg bg-brand-500 blur-md opacity-60" />
              <div className="relative rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 p-1.5">
                <Dumbbell className="w-4 h-4 text-white" />
              </div>
            </div>
            <span className="font-display font-bold text-lg tracking-tight">
              Gym<span className="text-brand-400">Flow</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {[
              { label: 'Funcionalidades', href: '#funcionalidades' },
              { label: 'Preços', href: '#preco' },
              { label: 'Sobre', href: '#sobre' },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-4 py-2">
              Entrar
            </Link>
            <Link href="/cadastro" className="btn-primary text-sm px-5 py-2.5 rounded-xl">
              Começar grátis
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-100 transition-all"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border/60 bg-background/95 backdrop-blur-xl"
          >
            <div className="px-4 py-4 flex flex-col gap-2">
              {[
                { label: 'Funcionalidades', href: '#funcionalidades' },
                { label: 'Preços', href: '#preco' },
                { label: 'Sobre', href: '#sobre' },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface-100 transition-all"
                >
                  {item.label}
                </a>
              ))}
              <div className="pt-2 border-t border-border/60 flex flex-col gap-2">
                <Link href="/login" className="px-4 py-3 rounded-xl text-sm font-medium text-center text-muted-foreground hover:bg-surface-100 transition-all">
                  Entrar
                </Link>
                <Link href="/cadastro" className="btn-primary text-sm py-3 rounded-xl text-center">
                  Começar grátis
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}

// ──────────────────────────────────────────────
// Hero Section
// ──────────────────────────────────────────────
function Hero() {
  const reduceMotion = useReducedMotion()

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(99,102,241,1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(99,102,241,1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Glowing orbs — skipped for reduced motion */}
      {!reduceMotion && (
        <>
          <motion.div
            animate={{ scale: [1, 1.18, 1], opacity: [0.35, 0.65, 0.35] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-1/4 left-1/4 w-[640px] h-[640px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)' }}
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.25, 0.50, 0.25] }}
            transition={{ duration: 10, repeat: Infinity, delay: 2, ease: 'easeInOut' }}
            className="absolute bottom-1/4 right-1/4 w-[520px] h-[520px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.09) 0%, transparent 70%)' }}
          />
          <motion.div
            animate={{ scale: [1, 1.12, 1], opacity: [0.20, 0.40, 0.20] }}
            transition={{ duration: 13, repeat: Infinity, delay: 5, ease: 'easeInOut' }}
            className="absolute top-3/4 left-1/2 w-[380px] h-[380px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 70%)' }}
          />
        </>
      )}

      {/* CSS particles */}
      <ParticleField count={8} />

      <div className="relative z-10 w-full">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left — Copy */}
            <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-8">
              {/* Badge */}
              <motion.div variants={fadeUp}>
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold">
                  <span className="pulse-dot" />
                  Novo: PWA com modo offline
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1 variants={fadeUp} className="text-5xl sm:text-6xl lg:text-7xl font-display font-extrabold leading-[0.95] tracking-tight">
                Sua academia no
                <span className="block gradient-text mt-1">nível certo.</span>
              </motion.h1>

              {/* Subheadline */}
              <motion.p variants={fadeUp} className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                Plataforma completa para academias modernas. Gerencie treinos, acompanhe a
                evolução dos alunos e escale seu negócio — tudo em um só lugar.
              </motion.p>

              {/* CTAs */}
              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/cadastro"
                  className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-white overflow-hidden transition-all duration-300"
                  style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)' }}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Começar grátis
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: 'linear-gradient(135deg, #818CF8, #6366F1)' }} />
                </Link>

                <a
                  href="/demo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl font-semibold text-muted-foreground hover:text-foreground border border-border/60 hover:border-border hover:bg-surface-100 transition-all duration-200"
                >
                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-brand-500/15">
                    <Play className="w-3 h-3 text-brand-400 ml-0.5" />
                  </div>
                  Ver demonstração
                </a>
              </motion.div>

              {/* Social proof */}
              <motion.div variants={fadeUp} className="flex items-center gap-6 pt-2">
                <div className="flex -space-x-2.5">
                  {['#6366F1', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'].map((color, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border-2 border-background"
                      style={{ background: `linear-gradient(135deg, ${color}, ${color}88)` }}
                    />
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-0.5">
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Junte-se às primeiras academias no <span className="text-foreground font-semibold">GymFlow</span>
                  </p>
                </div>
              </motion.div>
            </motion.div>

            {/* Right — UI mockup */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative lg:pl-8"
            >
              {/* Main card */}
              <div className="glass rounded-3xl p-6 border border-brand-500/10 shadow-glow">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Dashboard</p>
                    <h3 className="font-display font-bold">Visão geral</h3>
                  </div>
                  <div className="badge-success text-xs">Ao vivo</div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { label: 'Alunos', value: '247', color: '#6366F1', icon: Users },
                    { label: 'Treinos hoje', value: '38', color: '#10B981', icon: Activity },
                    { label: 'Freq. semanal', value: '91%', color: '#06B6D4', icon: TrendingUp },
                  ].map(({ label, value, color, icon: Icon }) => (
                    <div key={label} className="rounded-xl p-3" style={{ background: `${color}10`, border: `1px solid ${color}25` }}>
                      <Icon className="w-4 h-4 mb-2" style={{ color }} />
                      <p className="font-display font-bold text-lg leading-none">{value}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Activity bars */}
                <div className="space-y-2.5">
                  <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
                    Atividade semanal
                  </p>
                  <div className="flex items-end gap-2 h-20">
                    {[65, 80, 45, 90, 70, 85, 60].map((h, i) => (
                      <motion.div
                        key={i}
                        className="flex-1 rounded-md"
                        style={{ background: 'linear-gradient(to top, #6366F1, #818CF8)' }}
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ delay: 0.5 + i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    {['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map(d => <span key={d}>{d}</span>)}
                  </div>
                </div>
              </div>

              {/* Floating cards */}
              <FloatingCard
                className="absolute -left-12 top-8 w-52"
                delay={0.6}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-500/15">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Evolução</p>
                    <p className="font-bold text-sm text-emerald-400">+12.4 kg</p>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">Supino reto — últimas 4 semanas</p>
              </FloatingCard>

              <FloatingCard
                className="absolute -right-6 bottom-12 w-56 animate-float-delayed"
                delay={0.8}
              >
                <p className="text-[10px] text-muted-foreground font-medium mb-2">Próximo treino</p>
                <p className="font-display font-bold text-sm mb-1">Treino A — Peito e Tríceps</p>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>6 exercícios · ~55 min</span>
                </div>
                <div className="mt-3 h-1.5 bg-surface-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-brand-500 to-cyan-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: '75%' }}
                    transition={{ delay: 1.2, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </FloatingCard>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <p className="text-xs text-muted-foreground/50 font-medium">Rolar para ver mais</p>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-5 h-8 rounded-full border border-border/40 flex items-start justify-center pt-1.5"
        >
          <div className="w-1 h-2 rounded-full bg-brand-400" />
        </motion.div>
      </motion.div>
    </section>
  )
}

// ──────────────────────────────────────────────
// Features Section
// ──────────────────────────────────────────────
const features = [
  {
    icon: Shield,
    title: 'Multi-tenant com RLS',
    description:
      'Cada academia é um tenant isolado com Row Level Security no PostgreSQL. Os dados nunca se misturam.',
    color: '#6366F1',
    gradient: 'from-brand-500/20 to-transparent',
  },
  {
    icon: Dumbbell,
    title: 'Fichas de treino completas',
    description:
      'Crie fichas personalizadas com séries, repetições, descanso e vídeos demonstrativos.',
    color: '#06B6D4',
    gradient: 'from-cyan-500/20 to-transparent',
  },
  {
    icon: TrendingUp,
    title: 'Evolução em gráficos',
    description:
      'Acompanhe a progressão de carga de cada exercício com gráficos interativos e histórico completo.',
    color: '#10B981',
    gradient: 'from-emerald-500/20 to-transparent',
  },
  {
    icon: Users,
    title: 'Gestão de alunos e personais',
    description:
      'Convide alunos por link ou código, atribua personais e gerencie toda a equipe.',
    color: '#F59E0B',
    gradient: 'from-amber-500/20 to-transparent',
  },
  {
    icon: Smartphone,
    title: 'PWA — mobile nativo',
    description:
      'Experiência de app instalável no celular. Registre séries e consulte fichas mesmo offline.',
    color: '#8B5CF6',
    gradient: 'from-violet-500/20 to-transparent',
  },
  {
    icon: Zap,
    title: 'Execução em tempo real',
    description:
      'Registre cada série, peso e repetição ao vivo com cronômetro de descanso integrado.',
    color: '#F97316',
    gradient: 'from-orange-500/20 to-transparent',
  },
  {
    icon: BarChart2,
    title: 'Dashboard analítico',
    description:
      'Frequência semanal, mapa de calor, exercícios mais populares e métricas de retenção.',
    color: '#EC4899',
    gradient: 'from-pink-500/20 to-transparent',
  },
  {
    icon: Lock,
    title: 'Planos e assinatura',
    description:
      'Free, Starter e Pro com Stripe. Webhook processado na edge para upgrades instantâneos.',
    color: '#14B8A6',
    gradient: 'from-teal-500/20 to-transparent',
  },
]

function FeaturesSection() {
  return (
    <section id="funcionalidades" className="relative py-24 lg:py-32 overflow-hidden">
      <ParticleField count={5} />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          className="text-center mb-16 space-y-4"
        >
          <motion.div variants={fadeUp}>
            <span className="badge-primary text-xs uppercase tracking-widest">Funcionalidades</span>
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-4xl lg:text-5xl font-display font-extrabold">
            Tudo que sua academia precisa
          </motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Do cadastro da academia até o registro do último set — o GymFlow cobre todo o fluxo
            de gestão fitness em uma plataforma integrada.
          </motion.p>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={scaleIn}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="glass rounded-2xl p-6 group cursor-default transition-all duration-300 hover:border-brand-500/20 hover:shadow-card-hover"
            >
              <div
                className={cn(
                  'w-11 h-11 rounded-xl flex items-center justify-center mb-4',
                  'transition-all duration-300 group-hover:scale-110'
                )}
                style={{ background: `${f.color}18`, border: `1px solid ${f.color}30` }}
              >
                <f.icon className="w-5 h-5" style={{ color: f.color }} />
              </div>
              <h3 className="font-display font-bold mb-2 leading-snug">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// ──────────────────────────────────────────────
// Personas Section
// ──────────────────────────────────────────────
const personas = [
  {
    role: 'owner',
    label: 'Proprietário',
    emoji: '🏢',
    color: '#6366F1',
    headline: 'Gerencie tudo em um painel',
    features: [
      'Cadastro da academia com CNPJ',
      'Busca de fotos e horários via Google Places',
      'Convites para personais e alunos',
      'Painel com frequência e métricas',
      'Gestão de plano e faturamento',
      'Limite de alunos por plano',
    ],
  },
  {
    role: 'personal',
    label: 'Personal Trainer',
    emoji: '💪',
    color: '#06B6D4',
    headline: 'Monte fichas completas',
    features: [
      'Lista de alunos vinculados',
      'Criação de fichas personalizadas',
      'Biblioteca com 40+ exercícios',
      'Séries, reps, descanso e notas',
      'Histórico de treinos do aluno',
      'Sugestão de carga automática',
    ],
  },
  {
    role: 'student',
    label: 'Aluno',
    emoji: '🎯',
    color: '#10B981',
    headline: 'Acompanhe sua evolução',
    features: [
      'Cadastro via link ou código',
      'Ficha de treino atualizada',
      'Execução com cronômetro',
      'Registro de carga por série',
      'Histórico e gráfico de evolução',
      'PWA instalável no celular',
    ],
  },
]

function PersonasSection() {
  const [activeRole, setActiveRole] = useState(0)

  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(6,182,212,0.06) 0%, transparent 70%)' }} />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="text-center mb-16 space-y-4"
        >
          <motion.div variants={fadeUp}>
            <span className="badge-cyan text-xs uppercase tracking-widest">Para todos</span>
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-4xl lg:text-5xl font-display font-extrabold">
            Uma plataforma,
            <span className="block gradient-text">três experiências</span>
          </motion.h2>
        </motion.div>

        {/* Tab selector */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="flex justify-center mb-10"
        >
          <div className="inline-flex p-1 rounded-2xl bg-surface-100 border border-border/60">
            {personas.map((p, i) => (
              <button
                key={p.role}
                onClick={() => setActiveRole(i)}
                className={cn(
                  'px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
                  activeRole === i
                    ? 'bg-card text-foreground shadow-md border border-border/60'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {p.emoji} {p.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Active persona card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeRole}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-3xl mx-auto"
          >
            {(() => {
              const p = personas[activeRole]!
              return (
                <div className="glass rounded-3xl p-8 border-2 transition-all duration-300"
                  style={{ borderColor: `${p.color}30` }}>
                  <div className="flex items-start gap-5 mb-7">
                    <div className="text-5xl">{p.emoji}</div>
                    <div>
                      <div className="badge mb-2 text-xs" style={{ background: `${p.color}15`, color: p.color, borderColor: `${p.color}30` }}>
                        {p.label}
                      </div>
                      <h3 className="text-2xl font-display font-bold">{p.headline}</h3>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {p.features.map((feat) => (
                      <div key={feat} className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: `${p.color}15` }}>
                          <Check className="w-3 h-3" style={{ color: p.color }} />
                        </div>
                        <span className="text-sm text-muted-foreground">{feat}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-7 pt-7 border-t border-border/40">
                    <Link
                      href="/cadastro"
                      className="inline-flex items-center gap-2 font-semibold text-sm transition-all"
                      style={{ color: p.color }}
                    >
                      Criar conta gratuita
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              )
            })()}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}

// ──────────────────────────────────────────────
// How it Works
// ──────────────────────────────────────────────
const steps = [
  {
    number: '01',
    title: 'Academia se cadastra',
    description: 'Dono cria a conta, insere o CNPJ e os dados são preenchidos automaticamente pela ReceitaWS + Google Places.',
    icon: Award,
    color: '#6366F1',
  },
  {
    number: '02',
    title: 'Convida a equipe',
    description: 'Gera links ou códigos de convite para personais e alunos. Cada um se cadastra com uma senha simples.',
    icon: Users,
    color: '#06B6D4',
  },
  {
    number: '03',
    title: 'Personal monta a ficha',
    description: 'Seleciona exercícios da biblioteca, define séries, reps e descanso para cada aluno individualmente.',
    icon: Target,
    color: '#10B981',
  },
  {
    number: '04',
    title: 'Aluno executa e evolui',
    description: 'Abre o app, executa o treino, registra a carga de cada série e acompanha sua evolução em gráficos.',
    icon: TrendingUp,
    color: '#F59E0B',
  },
]

function HowItWorksSection() {
  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      {/* Gradiente de entrada — torna a transição visível */}
      <div
        className="absolute top-0 inset-x-0 h-48 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(99,102,241,0.13) 0%, rgba(6,182,212,0.04) 60%, transparent 100%)' }}
      />
      <ParticleField count={6} />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="text-center mb-16 space-y-4"
        >
          <motion.div variants={fadeUp}>
            <span className="badge-success text-xs uppercase tracking-widest">Como funciona</span>
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-4xl lg:text-5xl font-display font-extrabold">
            Do zero ao treino em minutos
          </motion.h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Connecting line — animada ao entrar na viewport */}
          <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5 rounded-full overflow-hidden bg-surface-100/40">
            <motion.div
              className="h-full origin-left bg-gradient-to-r from-brand-500/60 via-cyan-500/60 to-amber-500/60"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.4, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>

          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: i * 0.18 }}
              className="relative"
            >
              <motion.div
                className="glass rounded-2xl p-6 text-center group cursor-default border border-transparent"
                whileHover={{
                  y: -8,
                  borderColor: `${step.color}25`,
                  boxShadow: `0 20px 40px rgba(0,0,0,0.35), 0 0 24px ${step.color}20`,
                  transition: { duration: 0.25, ease: 'easeOut' },
                }}
              >
                {/* Step number badge */}
                <div
                  className="relative inline-flex items-center justify-center w-12 h-12 rounded-2xl font-display font-black text-sm mb-5 z-10 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `${step.color}18`, border: `1px solid ${step.color}30`, color: step.color }}
                >
                  {step.number}
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ boxShadow: `0 0 24px ${step.color}50` }}
                  />
                </div>

                <motion.div whileHover={{ rotate: [0, -8, 8, 0], transition: { duration: 0.45 } }}>
                  <step.icon className="w-6 h-6 mx-auto mb-4" style={{ color: step.color }} />
                </motion.div>

                <h3 className="font-display font-bold mb-2 leading-snug">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ──────────────────────────────────────────────
// Pricing Section
// ──────────────────────────────────────────────
const plans = [
  {
    id: 'personal',
    name: 'Personal',
    price: 97,
    period: '/mês',
    description: 'Para personal trainers independentes',
    features: [
      'Até 20 alunos',
      'Fichas ilimitadas',
      'Biblioteca de exercícios',
      'Histórico de treinos',
      'Convites por link',
      '14 dias grátis',
    ],
    cta: 'Começar grátis',
    href: '/cadastro?plan=personal',
    popular: false,
    color: '#8B5CF6',
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 197,
    period: '/mês',
    description: 'Para academias em crescimento',
    features: [
      'Até 50 alunos',
      'Até 3 personais',
      'Fichas ilimitadas',
      'Dashboard analítico',
      'Convites por código',
      '30 dias grátis',
    ],
    cta: 'Começar grátis por 30 dias',
    href: '/cadastro?plan=starter',
    popular: true,
    color: '#06B6D4',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 397,
    period: '/mês',
    description: 'Para academias estabelecidas',
    features: [
      'Alunos ilimitados',
      'Personais ilimitados',
      'Relatórios avançados',
      'Exportar dados (CSV)',
      'Notificações de inatividade',
      'Suporte prioritário',
    ],
    cta: 'Assinar Pro',
    href: '/cadastro?plan=pro',
    popular: false,
    color: '#10B981',
  },
]

function PricingSection() {
  return (
    <section id="preco" className="relative py-24 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(99,102,241,0.07) 0%, transparent 70%)' }} />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="text-center mb-16 space-y-4"
        >
          <motion.div variants={fadeUp}>
            <span className="badge-warning text-xs uppercase tracking-widest">Preços</span>
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-4xl lg:text-5xl font-display font-extrabold">
            Simples e transparente
          </motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground text-lg max-w-xl mx-auto">
            14 dias de trial grátis nos planos pagos. Cancele quando quiser, sem fidelidade.
          </motion.p>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
        >
          {plans.map((plan) => (
            <motion.div
              key={plan.id}
              variants={scaleIn}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className={cn(
                'relative glass rounded-3xl p-7 flex flex-col',
                plan.popular && 'border-brand-500/40 shadow-glow-sm'
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-brand-500 to-cyan-500 text-white text-xs font-bold shadow-glow-sm">
                    ⚡ Mais popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <div
                  className="badge mb-3"
                  style={{ background: `${plan.color}15`, color: plan.color, borderColor: `${plan.color}30` }}
                >
                  {plan.name}
                </div>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-display font-extrabold">
                    {plan.price === 0 ? 'Grátis' : `R$ ${plan.price}`}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-muted-foreground text-sm mb-1">{plan.period}</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-center gap-2.5 text-sm">
                    <Check className="w-4 h-4 flex-shrink-0" style={{ color: plan.color }} />
                    <span className="text-muted-foreground">{feat}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={cn(
                  'btn text-sm py-3 rounded-xl text-center font-bold',
                  plan.popular
                    ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:from-brand-400 hover:to-brand-500 shadow-glow-sm hover:shadow-glow'
                    : 'bg-surface-200 text-foreground hover:bg-surface-300 border border-border'
                )}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// ──────────────────────────────────────────────
// Sobre Section
// ──────────────────────────────────────────────
function SobreSection() {
  const values = [
    {
      icon: Target,
      title: 'Missão',
      description: 'Tornar a gestão de academias acessível e eficiente, do menor estúdio ao complexo fitness.',
      color: '#6366F1',
    },
    {
      icon: TrendingUp,
      title: 'Visão',
      description: 'Ser a plataforma de referência para academias independentes no Brasil e América Latina.',
      color: '#06B6D4',
    },
    {
      icon: Shield,
      title: 'Valores',
      description: 'Simplicidade, privacidade e foco no usuário final — o aluno que treina com as mãos suadas.',
      color: '#10B981',
    },
  ]

  return (
    <section id="sobre" className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          className="text-center mb-16 space-y-4"
        >
          <motion.div variants={fadeUp}>
            <span className="badge-primary text-xs uppercase tracking-widest">Sobre nós</span>
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-4xl lg:text-5xl font-display font-extrabold">
            Feito por quem entende
            <span className="block gradient-text">o chão da academia</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            O GymFlow nasceu da frustração com ferramentas genéricas que não entendiam o dia a dia de academias
            independentes. Criamos uma plataforma focada em simplicidade, velocidade e experiência mobile — porque
            o aluno está na academia, não na frente do computador.
          </motion.p>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-50px' }}
          className="grid md:grid-cols-3 gap-6 mb-16"
        >
          {values.map((v) => (
            <motion.div
              key={v.title}
              variants={scaleIn}
              className="glass rounded-2xl p-7 group hover:border-brand-500/20 transition-all duration-300 hover:-translate-y-1"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                style={{ background: `${v.color}18`, border: `1px solid ${v.color}30` }}
              >
                <v.icon className="w-5 h-5" style={{ color: v.color }} />
              </div>
              <h3 className="font-display font-bold text-lg mb-2">{v.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{v.description}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="glass rounded-3xl p-8 lg:p-12 max-w-4xl mx-auto"
          style={{ borderColor: 'rgba(99,102,241,0.2)' }}
        >
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <span className="badge-primary text-xs">Nossa história</span>
              <h3 className="text-2xl font-display font-bold leading-snug">
                Uma startup brasileira,<br />com o coração na academia
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Desenvolvido no Brasil, o GymFlow é construído com as melhores tecnologias modernas — Next.js,
                Supabase e Stripe — para entregar uma experiência de nível enterprise acessível para qualquer academia.
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Nossa prioridade é o aluno que usa o app durante o treino: interface limpa, rápida e que funciona
                mesmo com sinal fraco.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Fundado em', value: '2024', color: '#6366F1' },
                { label: 'País', value: '🇧🇷 Brasil', color: '#10B981' },
                { label: 'Stack', value: 'Next.js + Supabase', color: '#06B6D4' },
                { label: 'Foco', value: 'Mobile-first', color: '#F59E0B' },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className="rounded-xl p-4"
                  style={{ background: `${color}10`, border: `1px solid ${color}20` }}
                >
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
                  <p className="font-display font-bold text-sm">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ──────────────────────────────────────────────
// CTA Section
// ──────────────────────────────────────────────
function CTASection() {
  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-3xl p-12 text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(6,182,212,0.10))',
            border: '1px solid rgba(99,102,241,0.25)',
          }}
        >
          <div className="absolute inset-0 bg-mesh opacity-50" />
          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 text-brand-300 text-sm font-semibold">
              <Zap className="w-4 h-4" />
              Comece em menos de 5 minutos
            </div>
            <h2 className="text-4xl lg:text-5xl font-display font-extrabold">
              Sua academia merece
              <span className="block gradient-text">uma gestão profissional</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Sem cartão de crédito. Sem contratos. Cancele quando quiser.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                href="/cadastro"
                className="group relative inline-flex items-center justify-center gap-2 px-10 py-4 rounded-2xl font-bold text-white text-lg overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)' }}
              >
                <span className="relative z-10 flex items-center gap-2">
                  Criar conta gratuita
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ──────────────────────────────────────────────
// Footer
// ──────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t border-border/40 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="relative flex items-center justify-center w-7 h-7">
                <div className="absolute inset-0 rounded-lg bg-brand-500 blur-sm opacity-50" />
                <div className="relative rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 p-1.5">
                  <Dumbbell className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
              <span className="font-display font-bold">Gym<span className="text-brand-400">Flow</span></span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Plataforma SaaS para academias modernas.
            </p>
          </div>

          {[
            {
              title: 'Produto',
              links: [
                { label: 'Funcionalidades', href: '#funcionalidades' },
                { label: 'Preços', href: '#preco' },
                { label: 'Segurança', href: '/privacidade' },
              ],
            },
            {
              title: 'Empresa',
              links: [
                { label: 'Sobre', href: '#sobre' },
                { label: 'Contato', href: 'mailto:contato@gymflow.app' },
              ],
            },
            {
              title: 'Legal',
              links: [
                { label: 'Privacidade', href: '/privacidade' },
                { label: 'Termos', href: '/termos' },
                { label: 'Cookies', href: '/privacidade#cookies' },
                { label: 'LGPD', href: '/privacidade#lgpd' },
              ],
            },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="font-semibold text-sm mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="divider pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} GymFlow. Todos os direitos reservados.
          </p>
          <p className="text-xs text-muted-foreground">
            Feito com ❤️ no Brasil
          </p>
        </div>
      </div>
    </footer>
  )
}

// ──────────────────────────────────────────────
// Stats Bar
// ──────────────────────────────────────────────
const STATS = [
  { label: 'Multi-tenant com RLS',        end: 100,  suffix: '%', color: '#6366F1' },
  { label: 'Exercícios no catálogo',      end: 200,  suffix: '+', color: '#06B6D4' },
  { label: 'Uptime de infraestrutura',    end: 99.9, suffix: '%', color: '#10B981' },
  { label: 'Suporte por e-mail',          end: 24,   suffix: 'h', color: '#F59E0B' },
]

function StatsBar() {
  return (
    <section className="relative py-10 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(90deg, rgba(99,102,241,0.06) 0%, rgba(6,182,212,0.04) 50%, rgba(99,102,241,0.06) 100%)' }} />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 divide-y-2 lg:divide-y-0 lg:divide-x divide-border/30"
        >
          {STATS.map(({ label, end, suffix, color }) => (
            <motion.div
              key={label}
              variants={fadeUp}
              className="flex flex-col items-center justify-center py-4 lg:py-0 text-center px-6"
            >
              <p className="text-4xl font-display font-extrabold tabular-nums" style={{ color }}>
                <Counter end={end} suffix={suffix} />
              </p>
              <p className="text-sm text-muted-foreground mt-1 font-medium">{label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// ──────────────────────────────────────────────
// Testimonials Section
// ──────────────────────────────────────────────
const testimonials = [
  {
    quote: 'Antes eu usava planilha para tudo. O GymFlow substituiu 3 ferramentas de uma vez — e meus alunos adoram o app.',
    name: 'Rodrigo Faria',
    title: 'Proprietário · Academia Shape',
    location: 'São Paulo, SP',
    color: '#6366F1',
    rating: 5,
    initial: 'R',
  },
  {
    quote: 'Consigo ver em tempo real quem treinou hoje, quem está sumindo e criar fichas em menos de 5 minutos. Simplesmente indispensável.',
    name: 'Amanda Souza',
    title: 'Personal Trainer',
    location: 'Curitiba, PR',
    color: '#06B6D4',
    rating: 5,
    initial: 'A',
  },
  {
    quote: 'Minha streak chegou a 30 dias! A gamificação me mantém focada. Nunca fui tão consistente na academia.',
    name: 'Letícia Nunes',
    title: 'Aluna · SmartFit Morumbi',
    location: 'São Paulo, SP',
    color: '#10B981',
    rating: 5,
    initial: 'L',
  },
  {
    quote: 'A integração de convites por QR code e código é genial. Todos os meus alunos entraram sem nenhum problema técnico.',
    name: 'Carlos Mendes',
    title: 'Proprietário · Studio Body Pro',
    location: 'Belo Horizonte, MG',
    color: '#F59E0B',
    rating: 5,
    initial: 'C',
  },
  {
    quote: 'O dashboard analítico me ajudou a perceber que 40% dos alunos estavam inativos. Consegui reengajar 80% deles em um mês.',
    name: 'Patricia Lima',
    title: 'Gerente · Power Gym',
    location: 'Rio de Janeiro, RJ',
    color: '#8B5CF6',
    rating: 5,
    initial: 'P',
  },
  {
    quote: 'Instalei como PWA no celular e funciona até sem internet na academia. Isso faz diferença no dia a dia de treino.',
    name: 'Thiago Oliveira',
    title: 'Aluno · CrossFit Vila Madalena',
    location: 'São Paulo, SP',
    color: '#EC4899',
    rating: 5,
    initial: 'T',
  },
]

function TestimonialsSection() {
  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 100%, rgba(99,102,241,0.07) 0%, transparent 70%)' }} />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="text-center mb-16 space-y-4"
        >
          <motion.div variants={fadeUp}>
            <span className="badge-success text-xs uppercase tracking-widest">Depoimentos</span>
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-4xl lg:text-5xl font-display font-extrabold">
            Quem usa, recomenda
          </motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Mais de 500 academias, personais e alunos transformaram a forma de treinar com o GymFlow.
          </motion.p>

          {/* Rating bar */}
          <motion.div variants={fadeUp} className="flex items-center justify-center gap-3 pt-2">
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map((s) => (
                <Star key={s} className="w-5 h-5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="font-display font-bold text-lg">4.9</span>
            <span className="text-muted-foreground text-sm">· 99% de satisfação</span>
          </motion.div>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {testimonials.map((t) => (
            <motion.div
              key={t.name}
              variants={scaleIn}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="glass rounded-2xl p-6 flex flex-col gap-4 group cursor-default hover:border-brand-500/20 transition-all duration-300"
            >
              {/* Quote icon */}
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${t.color}15`, border: `1px solid ${t.color}25` }}>
                <Quote className="w-4 h-4" style={{ color: t.color }} />
              </div>

              {/* Text */}
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Stars */}
              <div className="flex items-center gap-0.5">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Author */}
              <div className="flex items-center gap-3 pt-1 border-t border-border/40">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${t.color}, ${t.color}99)` }}
                >
                  {t.initial}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{t.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{t.title} · {t.location}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// ──────────────────────────────────────────────
// FAQ Section
// ──────────────────────────────────────────────
const faqs = [
  {
    question: 'Preciso de cartão de crédito para começar?',
    answer: 'Não. O período de trial é 100% gratuito e não exige dados de pagamento. Você só adiciona um método de pagamento quando decidir assinar um plano pago.',
  },
  {
    question: 'O GymFlow funciona no celular?',
    answer: 'Sim. O GymFlow é um PWA (Progressive Web App) que pode ser instalado diretamente do navegador no iPhone e Android. Funciona mesmo com sinal fraco — perfeito para usar durante o treino.',
  },
  {
    question: 'Como meus alunos entram na plataforma?',
    answer: 'Você gera um link ou código de convite no painel. O aluno acessa o link, cria uma conta e entra automaticamente na sua academia — sem precisar de convite individual por e-mail.',
  },
  {
    question: 'Posso migrar dados de outra plataforma?',
    answer: 'Atualmente não temos importador automático, mas nossa equipe pode auxiliar na migração manual de fichas e histórico para os planos Pro. Entre em contato pelo suporte.',
  },
  {
    question: 'Quantos personais e alunos posso ter?',
    answer: 'Depende do plano: Starter suporta até 50 alunos e 3 personais. Pro é completamente ilimitado. Você pode fazer upgrade a qualquer momento direto do dashboard.',
  },
  {
    question: 'Os dados da minha academia ficam isolados?',
    answer: 'Sim. Usamos Row Level Security (RLS) no PostgreSQL para garantir isolamento total entre academias. Nenhum dado vaza entre tenants — é isolamento em nível de banco de dados.',
  },
  {
    question: 'Posso cancelar quando quiser?',
    answer: 'Sim, sem multa e sem fidelidade. Você cancela com um clique no painel de configurações e a cobrança para no próximo ciclo. Seus dados ficam disponíveis por 30 dias após o cancelamento.',
  },
  {
    question: 'O suporte é em português?',
    answer: 'Sim! Somos uma empresa brasileira e todo o suporte é feito em português, via chat e e-mail. Planos Pro têm acesso prioritário com tempo de resposta de até 4 horas.',
  },
]

function FAQSection() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="text-center mb-16 space-y-4"
        >
          <motion.div variants={fadeUp}>
            <span className="badge-primary text-xs uppercase tracking-widest">FAQ</span>
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-4xl lg:text-5xl font-display font-extrabold">
            Perguntas frequentes
          </motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground text-lg">
            Tudo que você precisa saber antes de começar.
          </motion.p>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="space-y-3"
        >
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              className={cn(
                'glass rounded-2xl border transition-all duration-300',
                open === i ? 'border-brand-500/30 shadow-glow-sm' : 'border-border/40 hover:border-brand-500/20'
              )}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 p-5 text-left"
              >
                <span className="font-semibold text-sm leading-snug">{faq.question}</span>
                <motion.div
                  animate={{ rotate: open === i ? 180 : 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="flex-shrink-0 w-6 h-6 rounded-full bg-surface-200 flex items-center justify-center"
                >
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border/30 pt-4">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>

        {/* Still have questions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 text-center"
        >
          <p className="text-sm text-muted-foreground">
            Ainda tem dúvidas?{' '}
            <a href="mailto:contato@gymflow.app" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
              Fale com a gente →
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  )
}

// ──────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-background bg-mesh">
      {/* Vignette — fixed viewport overlay, below nav (z-50) */}
      <div
        className="fixed inset-0 pointer-events-none z-[45]"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 80% 75% at 50% 50%, transparent 45%, rgba(0,0,0,0.55) 100%)',
        }}
      />
      <Nav />
      <main>
        <Hero />
        <StatsBar />
        <FeaturesSection />
        <PersonasSection />
        <SectionTransition />
        <HowItWorksSection />
        <PricingSection />
        <TestimonialsSection />
        <SobreSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
