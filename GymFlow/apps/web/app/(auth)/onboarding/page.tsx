'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dumbbell, ArrowRight, ArrowLeft, Check, Loader2,
  Building2, Users, Ticket, CreditCard, Zap, Lock,
} from 'lucide-react'
import { toast } from 'sonner'

import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'

const slide = {
  hidden: { opacity: 0, x: 24 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, x: -24, transition: { duration: 0.25 } },
}

// ── Planos ────────────────────────────────────────────────────
const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    label: 'para sempre',
    color: '#6366F1',
    features: ['Até 30 alunos', '1 personal', 'Fichas ilimitadas', 'PWA mobile'],
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 99,
    label: '/mês',
    color: '#06B6D4',
    popular: true,
    features: ['Até 100 alunos', '3 personais', 'Dashboard analítico', 'Suporte prioritário'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 199,
    label: '/mês',
    color: '#10B981',
    features: ['Alunos ilimitados', 'Personais ilimitados', 'Relatórios avançados', 'SLA garantido'],
  },
]

// ── Plano individual para alunos sem convite ──────────────────
const STUDENT_PLAN = {
  price: 29,
  features: [
    'Acesso completo ao app',
    'Crie suas próprias fichas',
    'Histórico e gráficos de evolução',
    'PWA instalável no celular',
    'Cancele quando quiser',
  ],
}

// ─────────────────────────────────────────────────────────────
type Role = 'owner' | 'student' | null

function OnboardingContent() {
  const router = useRouter()
  const supabase = createClient()
  const { profile, academies } = useAuthStore()

  const [role, setRole] = useState<Role>(null)
  const [plan, setPlan] = useState('free')
  const [academyName, setAcademyName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [hasInvite, setHasInvite] = useState<boolean | null>(null)
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState<'role' | 'personal' | 'plan' | 'academy' | 'invite' | 'payment'>('role')
  const [registeredAs, setRegisteredAs] = useState<'owner' | 'personal' | 'student' | null>(null)

  // Usuário já configurado → direto ao dashboard
  useEffect(() => {
    if (academies.length > 0) router.replace('/dashboard')
  }, [academies, router])

  // Pula seleção de role com base no que foi escolhido no cadastro
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: { user_metadata?: Record<string, string> } | null } }) => {
      if (!user) return
      const accountType = user.user_metadata?.account_type as 'owner' | 'personal' | 'student' | undefined
      if (!accountType) return
      setRegisteredAs(accountType)
      if (accountType === 'owner') {
        setRole('owner')
        setStep('plan')
      } else if (accountType === 'personal') {
        setStep('personal')
      } else if (accountType === 'student') {
        setRole('student')
        setStep('invite')
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const firstName = profile?.full_name?.split(' ')[0] ?? 'você'

  // ── Salvar academia (owner/personal) ─────────────────────
  async function saveAcademy() {
    if (!academyName.trim()) return
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      const slug =
        academyName
          .toLowerCase()
          .normalize('NFD')
          .replace(/[̀-ͯ]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') +
        '-' +
        Date.now().toString(36)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: newAcademy, error: academyError } = await (supabase.from('academies') as any).insert({
        owner_id: user.id,
        name: academyName,
        slug,
        plan,
      }).select().single()
      if (academyError) throw academyError

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: memberError } = await (supabase.from('academy_members') as any).insert({
        academy_id: newAcademy.id,
        user_id: user.id,
        role: 'owner',
        is_active: true,
      })
      if (memberError) throw memberError

      useAuthStore.getState().setCurrentAcademy(newAcademy, 'owner')
      useAuthStore.getState().setAcademies([{ academy: newAcademy, role: 'owner' }])

      toast.success('Academia criada com sucesso!')
      router.push('/dashboard')
    } catch {
      toast.error('Erro ao criar academia. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  // ── Validar código de convite ─────────────────────────────
  async function redeemInvite() {
    const trimmed = inviteCode.trim().toUpperCase()
    if (!trimmed) return
    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('invites')
        .select('token')
        .eq('code', trimmed)
        .eq('is_active', true)
        .single()
      if (error || !data) {
        toast.error('Código inválido ou expirado. Verifique e tente novamente.')
        return
      }
      router.push(`/convite/${(data as { token: string }).token}`)
    } catch {
      toast.error('Erro ao verificar código. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  // ── Stripe checkout placeholder ───────────────────────────
  function handleStudentPayment() {
    toast('Em breve! Pagamento individual será habilitado.', { icon: '🚧' })
  }

  // ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-10">
        <div className="relative flex items-center justify-center w-8 h-8">
          <div className="absolute inset-0 rounded-lg bg-brand-500 blur-sm opacity-50" />
          <div className="relative rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 p-1.5">
            <Dumbbell className="w-4 h-4 text-white" />
          </div>
        </div>
        <span className="font-display font-bold text-lg">
          Gym<span className="text-brand-400">Flow</span>
        </span>
      </div>

      <div className="w-full max-w-lg">
        <AnimatePresence mode="wait">

          {/* ── STEP: role picker ── */}
          {step === 'role' && (
            <motion.div key="role" variants={slide} initial="hidden" animate="show" exit="exit" className="space-y-6">
              <div>
                <h1 className="text-2xl font-display font-bold">
                  Bem-vindo, {firstName}! 👋
                </h1>
                <p className="text-muted-foreground mt-1.5 text-sm">
                  Como você vai usar o GymFlow?
                </p>
              </div>

              <div className="grid gap-3">
                <button
                  onClick={() => { setRole('owner'); setStep('plan') }}
                  className="flex items-center gap-4 p-5 rounded-2xl border border-border/60 hover:border-brand-500/40 hover:bg-brand-500/5 text-left transition-all duration-200 group"
                >
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-brand-500/15 flex-shrink-0 group-hover:scale-105 transition-transform">
                    <Building2 className="w-6 h-6 text-brand-400" />
                  </div>
                  <div>
                    <p className="font-semibold">Sou proprietário ou personal trainer</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Vou criar minha academia e gerenciar alunos
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => { setRole('student'); setStep('invite') }}
                  className="flex items-center gap-4 p-5 rounded-2xl border border-border/60 hover:border-cyan-500/40 hover:bg-cyan-500/5 text-left transition-all duration-200 group"
                >
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-cyan-500/15 flex-shrink-0 group-hover:scale-105 transition-transform">
                    <Users className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <p className="font-semibold">Sou aluno</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Quero acompanhar meus treinos e evolução
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP: personal ── */}
          {step === 'personal' && (
            <motion.div key="personal" variants={slide} initial="hidden" animate="show" exit="exit" className="space-y-6">
              <div>
                <h1 className="text-2xl font-display font-bold">
                  Bem-vindo, {firstName}! 💪
                </h1>
                <p className="text-muted-foreground mt-1.5 text-sm">
                  Como você vai atuar como personal trainer?
                </p>
              </div>

              <div className="grid gap-3">
                <button
                  onClick={() => { setRole('owner'); setStep('plan') }}
                  className="flex items-center gap-4 p-5 rounded-2xl border border-border/60 hover:border-brand-500/40 hover:bg-brand-500/5 text-left transition-all duration-200 group"
                >
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-brand-500/15 flex-shrink-0 group-hover:scale-105 transition-transform">
                    <Building2 className="w-6 h-6 text-brand-400" />
                  </div>
                  <div>
                    <p className="font-semibold">Trabalho de forma independente</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Crio minha própria academia e gerencio meus alunos
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => setHasInvite(true)}
                  className={cn(
                    'flex items-center gap-4 p-5 rounded-2xl border text-left transition-all duration-200 group',
                    hasInvite === true
                      ? 'border-emerald-500/50 bg-emerald-500/8'
                      : 'border-border/60 hover:border-emerald-500/40 hover:bg-emerald-500/5'
                  )}
                >
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-500/15 flex-shrink-0 group-hover:scale-105 transition-transform">
                    <Ticket className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-semibold">Fui convidado por uma academia</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Tenho um código de convite para entrar na equipe
                    </p>
                  </div>
                  {hasInvite === true
                    ? <div className="ml-auto w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0"><Check className="w-3 h-3 text-white" /></div>
                    : <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto group-hover:translate-x-1 transition-transform" />
                  }
                </button>
              </div>

              <AnimatePresence>
                {hasInvite === true && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 overflow-hidden"
                  >
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Código de convite</label>
                      <input
                        type="text"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                        placeholder="ABC123"
                        maxLength={6}
                        autoComplete="off"
                        className="field tracking-widest font-mono"
                        onKeyDown={(e) => e.key === 'Enter' && inviteCode.length === 6 && redeemInvite()}
                      />
                    </div>
                    <button
                      onClick={redeemInvite}
                      disabled={saving || inviteCode.length !== 6}
                      className="w-full btn-primary py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40"
                    >
                      {saving
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <><Check className="w-4 h-4" /> Entrar com convite</>
                      }
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── STEP: plan (owner / personal independente) ── */}
          {step === 'plan' && (
            <motion.div key="plan" variants={slide} initial="hidden" animate="show" exit="exit" className="space-y-6">
              <div>
                <button
                  onClick={() => setStep(registeredAs === 'personal' ? 'personal' : 'role')}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Voltar
                </button>
                <h1 className="text-2xl font-display font-bold">Escolha seu plano</h1>
                <p className="text-muted-foreground mt-1.5 text-sm">
                  Você pode mudar de plano a qualquer momento.
                </p>
              </div>

              <div className="grid gap-3">
                {PLANS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPlan(p.id)}
                    className={cn(
                      'relative flex items-center gap-4 p-4 rounded-2xl border text-left transition-all duration-200',
                      plan === p.id
                        ? 'border-brand-500/50 bg-brand-500/8 shadow-glow-sm'
                        : 'border-border/60 hover:border-border hover:bg-surface-100'
                    )}
                  >
                    {p.popular && (
                      <span className="absolute -top-2.5 right-4 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-brand-500 to-cyan-500 text-white">
                        Mais popular
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-display font-bold" style={{ color: p.color }}>{p.name}</span>
                        <span className="text-sm font-semibold">
                          {p.price === 0 ? 'Grátis' : `R$ ${p.price}`}
                          <span className="text-xs font-normal text-muted-foreground"> {p.label}</span>
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                        {p.features.map((f) => (
                          <span key={f} className="text-xs text-muted-foreground">{f}</span>
                        ))}
                      </div>
                    </div>
                    <div className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
                      plan === p.id ? 'bg-brand-500 border-brand-500' : 'border-border/60'
                    )}>
                      {plan === p.id && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setStep('academy')}
                className="w-full btn-primary py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
              >
                Continuar <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* ── STEP: academy name (owner) ── */}
          {step === 'academy' && (
            <motion.div key="academy" variants={slide} initial="hidden" animate="show" exit="exit" className="space-y-6">
              <div>
                <button onClick={() => setStep('plan')} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" /> Voltar
                </button>
                <h1 className="text-2xl font-display font-bold">Crie sua academia 🏢</h1>
                <p className="text-muted-foreground mt-1.5 text-sm">
                  Você pode ajustar os detalhes depois nas configurações.
                </p>
              </div>

              {/* Plan badge */}
              {(() => {
                const p = PLANS.find((x) => x.id === plan)!
                return (
                  <div className="glass rounded-xl px-4 py-3 flex items-center gap-3">
                    <Zap className="w-4 h-4" style={{ color: p.color }} />
                    <span className="text-sm">
                      Plano selecionado:{' '}
                      <span className="font-bold" style={{ color: p.color }}>{p.name}</span>
                      {p.price > 0 && (
                        <span className="text-muted-foreground text-xs"> — R$ {p.price}/mês</span>
                      )}
                    </span>
                  </div>
                )
              })()}

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Nome da academia</label>
                <input
                  type="text"
                  value={academyName}
                  onChange={(e) => setAcademyName(e.target.value)}
                  placeholder="Ex: Academia Força Total"
                  className="field"
                  onKeyDown={(e) => e.key === 'Enter' && academyName.trim() && saveAcademy()}
                />
              </div>

              <div className="glass rounded-2xl p-4 flex gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/15 flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Convide seus alunos depois</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Após criar a academia você receberá um link e código de convite para compartilhar.
                  </p>
                </div>
              </div>

              <button
                onClick={saveAcademy}
                disabled={saving || !academyName.trim()}
                className="w-full btn-primary py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {saving
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <><Check className="w-4 h-4" /> Criar academia e entrar</>
                }
              </button>
            </motion.div>
          )}

          {/* ── STEP: invite choice (student) ── */}
          {step === 'invite' && (
            <motion.div key="invite" variants={slide} initial="hidden" animate="show" exit="exit" className="space-y-6">
              <div>
                <button onClick={() => setStep('role')} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" /> Voltar
                </button>
                <h1 className="text-2xl font-display font-bold">Você tem um convite? 🎯</h1>
                <p className="text-muted-foreground mt-1.5 text-sm">
                  Se seu professor ou academia enviou um código, use-o para entrar gratuitamente.
                </p>
              </div>

              <div className="grid gap-3">
                <button
                  onClick={() => setHasInvite(true)}
                  className={cn(
                    'flex items-center gap-4 p-4 rounded-2xl border text-left transition-all duration-200',
                    hasInvite === true
                      ? 'border-emerald-500/50 bg-emerald-500/8'
                      : 'border-border/60 hover:border-border hover:bg-surface-100'
                  )}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/15 flex-shrink-0">
                    <Ticket className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Sim, tenho um código de convite</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Entro gratuitamente via convite do professor</p>
                  </div>
                  {hasInvite === true && (
                    <div className="ml-auto w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>

                <button
                  onClick={() => setHasInvite(false)}
                  className={cn(
                    'flex items-center gap-4 p-4 rounded-2xl border text-left transition-all duration-200',
                    hasInvite === false
                      ? 'border-amber-500/50 bg-amber-500/8'
                      : 'border-border/60 hover:border-border hover:bg-surface-100'
                  )}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500/15 flex-shrink-0">
                    <CreditCard className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Não tenho convite</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Quero assinar um plano individual</p>
                  </div>
                  {hasInvite === false && (
                    <div className="ml-auto w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              </div>

              {/* Inline: enter code */}
              <AnimatePresence>
                {hasInvite === true && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 overflow-hidden"
                  >
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Código de convite</label>
                      <input
                        type="text"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                        placeholder="ABC123"
                        maxLength={6}
                        autoComplete="off"
                        className="field tracking-widest font-mono"
                        onKeyDown={(e) => e.key === 'Enter' && inviteCode.length === 6 && redeemInvite()}
                      />
                    </div>
                    <button
                      onClick={redeemInvite}
                      disabled={saving || inviteCode.length !== 6}
                      className="w-full btn-primary py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40"
                    >
                      {saving
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <><Check className="w-4 h-4" /> Entrar com convite</>
                      }
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {hasInvite === false && (
                <div className="space-y-2">
                  <button
                    onClick={() => setStep('payment')}
                    className="w-full btn-primary py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
                  >
                    Ver plano individual <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => router.replace('/dashboard')}
                    className="w-full py-3 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Pular por agora
                  </button>
                </div>
              )}

              {hasInvite === null && (
                <button
                  onClick={() => router.replace('/dashboard')}
                  className="w-full py-3 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
                >
                  Pular por agora
                </button>
              )}
            </motion.div>
          )}

          {/* ── STEP: payment (student without invite) ── */}
          {step === 'payment' && (
            <motion.div key="payment" variants={slide} initial="hidden" animate="show" exit="exit" className="space-y-6">
              <div>
                <button onClick={() => setStep('invite')} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" /> Voltar
                </button>
                <h1 className="text-2xl font-display font-bold">Plano individual</h1>
                <p className="text-muted-foreground mt-1.5 text-sm">
                  Acesse o GymFlow sem precisar de uma academia.
                </p>
              </div>

              <div
                className="glass rounded-2xl p-6 space-y-5"
                style={{ border: '1px solid rgba(99,102,241,0.3)' }}
              >
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-display font-extrabold gradient-text">
                    R$ {STUDENT_PLAN.price}
                  </span>
                  <span className="text-muted-foreground text-sm mb-1">/mês</span>
                </div>

                <ul className="space-y-2.5">
                  {STUDENT_PLAN.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center bg-brand-500/15 flex-shrink-0">
                        <Check className="w-3 h-3 text-brand-400" />
                      </div>
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={handleStudentPayment}
                  className="w-full py-3.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)' }}
                >
                  <CreditCard className="w-4 h-4" />
                  Assinar por R$ {STUDENT_PLAN.price}/mês
                </button>

                <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <Lock className="w-3 h-3" />
                  Pagamento seguro · Cancele quando quiser
                </p>
              </div>

              <div className="glass rounded-xl p-4 flex gap-3">
                <Ticket className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  Se você ainda conseguir um convite da sua academia,{' '}
                  <button
                    onClick={() => { setHasInvite(true); setStep('invite') }}
                    className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors"
                  >
                    clique aqui para inserir o código
                  </button>{' '}
                  e entre gratuitamente.
                </p>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <OnboardingContent />
    </Suspense>
  )
}
