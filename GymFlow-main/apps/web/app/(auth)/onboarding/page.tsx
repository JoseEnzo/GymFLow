'use client'

import { useState, useEffect, Suspense, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, ArrowLeft, Check, Loader2,
  Building2, Users, Ticket, Zap, Mail,
} from 'lucide-react'
import { toast } from 'sonner'

import { BrandLogo } from '@/components/layout/brand-logo'
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
    id: 'starter',
    name: 'Starter',
    emoji: '⚡',
    price: 197,
    label: '/mês',
    color: '#06B6D4',
    popular: true,
    trial: true,
    features: ['Até 50 alunos', 'Até 3 personais', 'Fichas ilimitadas', 'Dashboard básico', 'Convites por código'],
  },
  {
    id: 'pro',
    name: 'Pro',
    emoji: '👑',
    price: 397,
    label: '/mês',
    color: '#10B981',
    features: ['Alunos ilimitados', 'Personais ilimitados', 'Relatórios avançados', 'Mapa de frequência', 'Exportar dados (CSV)', 'Notificações de inatividade', 'Personalização da academia', 'Histórico completo por aluno', 'Suporte prioritário'],
  },
]

// ─────────────────────────────────────────────────────────────
type Role = 'owner' | 'personal' | 'student' | null

function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createClient(), [])
  const { profile, academies } = useAuthStore()

  const [role, setRole] = useState<Role>(null)
  const [plan, setPlan] = useState(() => {
    const p = searchParams.get('plan')
    return PLANS.some(x => x.id === p) ? p! : 'starter'
  })
  const [academyName, setAcademyName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [hasInvite, setHasInvite] = useState<boolean | null>(null)
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState<'role' | 'plan' | 'academy' | 'invite'>('role')
  const [authChecked, setAuthChecked] = useState(false)

  // Usuário já configurado → direto ao dashboard
  useEffect(() => {
    if (academies.length > 0) router.replace('/dashboard')
  }, [academies, router])

  // Pula seleção de perfil se account_type já está no metadata (login com credenciais)
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      // Não autenticado → redireciona para login
      if (!data.user) {
        router.replace('/login')
        return
      }

      const accountType = data.user.user_metadata?.['account_type'] as string | undefined
      const planFromUrl       = searchParams.get('plan')
      const isAcademyPlan     = PLANS.some(x => x.id === planFromUrl)

      // Plano de academia → pula direto para nomear a academia
      if (isAcademyPlan) {
        setRole('owner')
        setStep('academy')
      } else if (accountType === 'student') {
        setRole('student')
        setStep('invite')
      } else if (accountType === 'owner') {
        setRole('owner')
        setStep('plan')
      } else if (accountType === 'personal') {
        setRole('personal')
        // Sem isso, o state `plan` ficava no default 'starter' e saveAcademy mandava
        // plan='starter' pra API mesmo o usuário vendo a tela do R$ 97.
        setPlan('personal')
        setStep('plan')
      }
      setAuthChecked(true)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const firstName = profile?.full_name?.split(' ')[0] ?? 'você'

  // ── Salvar academia (owner/personal) ─────────────────────
  async function saveAcademy(autoName?: string) {
    const name = autoName ?? academyName
    if (!name.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/academy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), plan }),
      })
      const json = await res.json()

      if (res.status === 409) {
        toast.error(json.error ?? 'CNPJ já cadastrado em outra academia.')
        await supabase.auth.signOut()
        router.replace('/cadastro')
        return
      }

      if (!res.ok) throw new Error(json.error ?? 'Erro ao criar academia')

      useAuthStore.getState().setCurrentAcademy(json.academy, 'owner')
      useAuthStore.getState().setAcademies([{ academy: json.academy, role: 'owner' }])

      if (json.checkoutUrl) {
        window.location.href = json.checkoutUrl
        return
      }

      toast.success('Academia criada com sucesso!')
      router.push('/dashboard')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar academia.')
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
        .limit(1)
      if (error || !data || data.length === 0) {
        toast.error('Código inválido ou expirado. Verifique e tente novamente.')
        return
      }
      router.push(`/convite/${(data[0] as { token: string } | undefined)!.token}`)
    } catch {
      toast.error('Erro ao verificar código. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  // ─────────────────────────────────────────────────────────
  if (!authChecked) {
    return <div className="min-h-screen bg-background" />
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Logo (link smart) */}
      <div className="mb-10">
        <BrandLogo size="lg" />
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
                  Como você vai usar o MeuTrein?
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
                    <p className="font-semibold">Sou proprietário de academia</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Vou criar minha academia e gerenciar alunos
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => { setRole('personal'); setPlan('personal'); setStep('plan') }}
                  className="flex items-center gap-4 p-5 rounded-2xl border border-border/60 hover:border-brand-500/40 hover:bg-brand-500/5 text-left transition-all duration-200 group"
                >
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-brand-500/15 flex-shrink-0 group-hover:scale-105 transition-transform">
                    <Users className="w-6 h-6 text-brand-400" />
                  </div>
                  <div>
                    <p className="font-semibold">Sou personal trainer</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Trabalho de forma independente com meus alunos
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

          {/* ── STEP: plan (owner) ── */}
          {step === 'plan' && role !== 'personal' && (
            <motion.div key="plan" variants={slide} initial="hidden" animate="show" exit="exit" className="space-y-6">
              <div>
                <button onClick={() => setStep('role')} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" /> Voltar
                </button>
                <h1 className="text-2xl font-display font-bold">Escolha seu plano</h1>
                <p className="text-muted-foreground mt-1.5 text-sm">
                  Você pode mudar de plano a qualquer momento.
                </p>
              </div>

              <div className="grid gap-3">
                {PLANS.map((p) => {
                  const selected = plan === p.id
                  return (
                    <button
                      key={p.id}
                      onClick={() => setPlan(p.id)}
                      className="relative p-4 rounded-2xl border text-left transition-all duration-200"
                      style={{
                        borderColor: selected ? p.color : 'rgba(255,255,255,0.1)',
                        background: selected ? `${p.color}0D` : undefined,
                      }}
                    >
                      {p.popular && (
                        <span className="absolute -top-2.5 right-4 text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                          style={{ background: p.color }}>
                          Mais popular
                        </span>
                      )}
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                          style={{ background: `${p.color}20` }}>
                          {p.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-display font-bold text-sm" style={{ color: p.color }}>{p.name}</span>
                            {'trial' in p && p.trial && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                                30 dias grátis
                              </span>
                            )}
                          </div>
                          <p className="text-lg font-display font-bold mb-2">
                            R$ {p.price}
                            <span className="text-xs font-normal text-muted-foreground"> {p.label}</span>
                          </p>
                          <ul className="space-y-1">
                            {p.features.map((f) => (
                              <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Check className="w-3 h-3 flex-shrink-0" style={{ color: p.color }} />
                                {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
                          style={{
                            borderColor: selected ? p.color : 'rgba(255,255,255,0.2)',
                            background: selected ? p.color : 'transparent',
                          }}>
                          {selected && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {plan === 'starter' && (
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <Mail className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-emerald-300/80 leading-relaxed">
                    Você terá <strong className="text-emerald-300">30 dias grátis</strong>. Após esse período, será cobrado R$ 197/mês automaticamente. Cancele quando quiser.
                  </p>
                </div>
              )}

              <button
                onClick={() => setStep('academy')}
                disabled={saving}
                className="w-full btn-primary py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {saving
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <>Continuar <ArrowRight className="w-4 h-4" /></>
                }
              </button>
            </motion.div>
          )}

          {/* ── STEP: plan (personal independente) ── */}
          {step === 'plan' && role === 'personal' && (
            <motion.div key="plan-personal" variants={slide} initial="hidden" animate="show" exit="exit" className="space-y-6">
              <div>
                <button onClick={() => setStep('role')} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" /> Voltar
                </button>
                <h1 className="text-2xl font-display font-bold">Plano Personal 💪</h1>
                <p className="text-muted-foreground mt-1.5 text-sm">
                  Gerencie seus alunos de forma independente.
                </p>
              </div>

              <div className="p-5 rounded-2xl border text-left" style={{ borderColor: '#10B981', background: '#10B9810D' }}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0" style={{ background: '#10B98120' }}>
                    🏋️
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-display font-bold text-sm" style={{ color: '#10B981' }}>Personal</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                        30 dias grátis
                      </span>
                    </div>
                    <p className="text-lg font-display font-bold mb-2">
                      R$ 97<span className="text-xs font-normal text-muted-foreground">/mês</span>
                    </p>
                    <ul className="space-y-1">
                      {[
                        'Alunos ilimitados',
                        'Fichas de treino ilimitadas',
                        'Histórico e evolução por aluno',
                        'Convites por código',
                        'Dashboard completo',
                      ].map((f) => (
                        <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Check className="w-3 h-3 flex-shrink-0 text-emerald-400" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <Mail className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-300/80 leading-relaxed">
                  Você terá <strong className="text-emerald-300">30 dias grátis</strong>. Após esse período, será cobrado R$ 97/mês automaticamente. Cancele quando quiser.
                </p>
              </div>

              <button
                onClick={() => saveAcademy(`${firstName} Personal`)}
                disabled={saving}
                className="w-full btn-primary py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {saving
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <><Check className="w-4 h-4" /> Começar 30 dias grátis</>
                }
              </button>
            </motion.div>
          )}

          {/* ── STEP: academy name (owner) ── */}
          {step === 'academy' && (
            <motion.div key="academy" variants={slide} initial="hidden" animate="show" exit="exit" className="space-y-6">
              <div>
                <button
                  onClick={() => PLANS.some(x => x.id === searchParams.get('plan')) ? router.back() : setStep('plan')}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors"
                >
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
                onClick={() => saveAcademy()}
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
                      ? 'border-brand-500/50 bg-brand-500/8'
                      : 'border-border/60 hover:border-border hover:bg-surface-100'
                  )}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-brand-500/15 flex-shrink-0">
                    <Users className="w-5 h-5 text-brand-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Não tenho convite</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Posso acessar mesmo assim</p>
                  </div>
                  {hasInvite === false && (
                    <div className="ml-auto w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center">
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
                <button
                  onClick={() => router.replace('/dashboard')}
                  className="w-full btn-primary py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
                >
                  Acessar o app <ArrowRight className="w-4 h-4" />
                </button>
              )}

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
