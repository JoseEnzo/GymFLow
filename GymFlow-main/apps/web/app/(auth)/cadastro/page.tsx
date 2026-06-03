'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Loader2, AlertCircle, Check, Building2, Dumbbell, ArrowLeft, ShieldCheck, UserCheck, ChevronRight, Ticket, CreditCard, ArrowRight } from 'lucide-react'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { validateCPF, validateCNPJ, maskCPF, maskCNPJ } from '@/lib/cnpj'
import { SocialButtons } from '@/components/auth/social-buttons'

const schema = z.object({
  fullName: z.string().min(3, 'Nome muito curto'),
  email: z.string().email('E-mail inválido'),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Deve conter letra maiúscula')
    .regex(/[0-9]/, 'Deve conter número'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

const passwordStrength = (pwd: string) => {
  let score = 0
  if (pwd.length >= 8) score++
  if (pwd.length >= 12) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++
  return score
}

const strengthLabels = ['Muito fraca', 'Fraca', 'Regular', 'Boa', 'Forte', 'Excelente']
const strengthColors = ['bg-red-500', 'bg-red-400', 'bg-amber-400', 'bg-amber-300', 'bg-emerald-400', 'bg-emerald-500']

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
}

const staggerForm = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

const TYPES = [
  {
    value: 'owner' as const,
    icon: Building2,
    title: 'Tenho uma academia',
    description: 'Gerencie alunos, personais e fichas de treino',
    color: '#1D9E75',
    bg: 'bg-brand-500/8',
    border: 'border-brand-500/40',
    iconBg: 'bg-brand-500/15',
    iconColor: 'text-brand-400',
  },
  {
    value: 'personal' as const,
    icon: UserCheck,
    title: 'Sou personal trainer',
    description: 'Monte fichas, acompanhe alunos e registre resultados',
    color: '#8B5CF6',
    bg: 'bg-violet-500/8',
    border: 'border-violet-500/40',
    iconBg: 'bg-violet-500/15',
    iconColor: 'text-violet-400',
  },
  {
    value: 'student' as const,
    icon: Dumbbell,
    title: 'Sou aluno',
    description: 'Acesse seus treinos e acompanhe sua evolução',
    color: '#6366F1',
    bg: 'bg-indigo-500/8',
    border: 'border-indigo-500/40',
    iconBg: 'bg-indigo-500/15',
    iconColor: 'text-indigo-400',
  },
]

function CadastroInner() {
  const { signUp, signInWithProvider } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const inviteToken = searchParams.get('token')

  // If arriving via invite, skip type selection
  const [step, setStep] = useState<0 | 'invite' | 1>(inviteToken ? 1 : 0)
  const [accountType, setAccountType] = useState<'owner' | 'personal' | 'student'>(inviteToken ? 'student' : 'owner')
  const [inviteRole, setInviteRole] = useState<'personal' | 'student' | null>(null)
  const [hasInvite, setHasInvite] = useState<boolean | null>(null)
  const [inviteCode, setInviteCode] = useState('')
  const [inviteSaving, setInviteSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [document, setDocument] = useState('')
  const [documentError, setDocumentError] = useState<string | null>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)

  useEffect(() => {
    if (!inviteToken) return
    fetch(`/api/invites/lookup?token=${encodeURIComponent(inviteToken)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data: { role?: string } | null) => {
        if (data?.role) {
          setInviteRole(data.role as 'personal' | 'student')
          setAccountType(data.role as 'personal' | 'student')
        }
      })
      .catch(() => null)
  }, [inviteToken])

  async function redeemInvite() {
    const trimmed = inviteCode.trim().toUpperCase()
    if (!trimmed) return
    setInviteSaving(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('invites')
        .select('token')
        .eq('code', trimmed)
        .eq('is_active', true)
        .limit(1)
      if (error || !data || data.length === 0) {
        toast.error('Código inválido ou expirado.')
        return
      }
      router.push(`/convite/${(data[0] as { token: string }).token}`)
    } catch {
      toast.error('Erro ao verificar código. Tente novamente.')
    } finally {
      setInviteSaving(false)
    }
  }

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const password = watch('password', '')
  const strength = passwordStrength(password)

  async function onSubmit(data: FormData) {
    setDocumentError(null)
    if (accountType === 'owner') {
      if (!validateCNPJ(document)) { setDocumentError('CNPJ inválido'); return }
    } else if (accountType === 'personal') {
      if (!validateCPF(document)) { setDocumentError('CPF inválido'); return }
    }

    setIsLoading(true)
    setServerError(null)
    try {
      const redirectTo = inviteToken ? `/convite/${inviteToken}` : undefined
      await signUp(data.email, data.password, data.fullName, accountType, redirectTo, document)
    } catch (err: unknown) {
      const msg = (err as Error).message
      if (msg.includes('already registered')) {
        setServerError('Este e-mail já está cadastrado. Faça login.')
      } else {
        setServerError(msg)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const selectedType = TYPES.find((t) => t.value === accountType)!

  return (
    <motion.div initial="hidden" animate="show" className="space-y-6">
      <AnimatePresence mode="wait">

        {/* ── Etapa 0: escolha de tipo ── */}
        {step === 0 && (
          <motion.div
            key="step-type"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            <div className="space-y-1.5">
              <h1 className="text-2xl font-display font-bold">Como você vai usar o GymFlow?</h1>
              <p className="text-sm text-muted-foreground">Escolha o perfil que melhor descreve você</p>
            </div>

            <div className="space-y-3">
              {TYPES.map((type) => {
                const Icon = type.icon
                const selected = accountType === type.value
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => {
                      setAccountType(type.value)
                      setStep(type.value === 'student' || type.value === 'personal' ? 'invite' : 1)
                    }}
                    className={cn(
                      'w-full flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-200 group',
                      selected
                        ? `${type.bg} ${type.border}`
                        : 'border-border/60 hover:border-border bg-surface-100/50 hover:bg-surface-100'
                    )}
                  >
                    <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all', type.iconBg)}>
                      <Icon className={cn('w-5 h-5', type.iconColor)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-base">{type.title}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{type.description}</p>
                    </div>
                    <ChevronRight className={cn('w-4 h-4 opacity-50 flex-shrink-0', type.iconColor)} />
                  </button>
                )
              })}
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/60" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-3 text-muted-foreground">ou continue com</span>
              </div>
            </div>

            <SocialButtons onLogin={signInWithProvider} />

            <p className="text-center text-sm text-muted-foreground">
              Já tem uma conta?{' '}
              <Link href="/login" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
                Fazer login
              </Link>
            </p>
          </motion.div>
        )}

        {/* ── Etapa convite (aluno) ── */}
        {step === 'invite' && (
          <motion.div
            key="step-invite"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => { setStep(0); setHasInvite(null); setInviteCode('') }}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Voltar
              </button>
              <h1 className="text-2xl font-display font-bold">Você tem um convite? 🎯</h1>
              <p className="text-sm text-muted-foreground">
                Se seu professor ou academia enviou um código, use-o para entrar gratuitamente.
              </p>
            </div>

            <div className="grid gap-3">
              <button
                type="button"
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
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">Sim, tenho um código de convite</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Entro gratuitamente via convite do professor</p>
                </div>
                {hasInvite === true && (
                  <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>

              <button
                type="button"
                onClick={() => setHasInvite(false)}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-2xl border text-left transition-all duration-200',
                  hasInvite === false
                    ? 'border-indigo-500/50 bg-indigo-500/8'
                    : 'border-border/60 hover:border-border hover:bg-surface-100'
                )}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-500/15 flex-shrink-0">
                  <CreditCard className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">Não tenho convite</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Quero criar minha conta e usar o app</p>
                </div>
                {hasInvite === false && (
                  <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
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
                    type="button"
                    onClick={redeemInvite}
                    disabled={inviteSaving || inviteCode.length !== 6}
                    className="w-full btn-primary py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    {inviteSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Entrar com convite</>}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {hasInvite === false && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full btn-primary py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
              >
                Criar conta <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        )}

        {/* ── Etapa 1: formulário ── */}
        {step === 1 && (
          <motion.div
            key="step-form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-5"
          >
            {/* Header */}
            <div className="space-y-1.5">
              {!inviteToken && (
                <button
                  type="button"
                  onClick={() => setStep(accountType === 'student' ? 'invite' : 0)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Voltar
                </button>
              )}
              <h1 className="text-2xl font-display font-bold">Criar sua conta</h1>
              <p className="text-sm text-muted-foreground">
                {inviteToken ? 'Crie sua conta para aceitar o convite' : 'Grátis para sempre, sem cartão de crédito'}
              </p>
            </div>

            {/* Type badge */}
            {!inviteToken && (
              <div className={cn(
                'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border',
                selectedType.bg, selectedType.border, selectedType.iconColor
              )}>
                <selectedType.icon className="w-3.5 h-3.5" />
                {selectedType.title}
              </div>
            )}

            {/* Invite banner */}
            {inviteToken && (
              inviteRole === 'personal' ? (
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm">
                  <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Você foi convidado como Personal Trainer</p>
                    <p className="text-indigo-400/70 text-xs mt-0.5">Após criar a conta, você terá acesso ao painel de treinos da academia.</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm">
                  <Check className="w-4 h-4 flex-shrink-0" />
                  Convite válido — após criar a conta você entrará automaticamente para a academia.
                </div>
              )
            )}

            {/* Error */}
            <AnimatePresence>
              {serverError && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  className="flex items-center gap-2.5 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-red-400 text-sm"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {serverError}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.form onSubmit={handleSubmit(onSubmit)} className="space-y-4" initial="hidden" animate="show" variants={staggerForm}>
              {/* Name */}
              <motion.div variants={fadeUp} className="space-y-1.5">
                <label className="text-sm font-medium">Nome completo</label>
                <input
                  {...register('fullName')}
                  type="text"
                  placeholder="João da Silva"
                  autoComplete="name"
                  className={cn('field', errors.fullName && 'border-destructive/60')}
                />
                {errors.fullName && <p className="text-xs text-red-400">{errors.fullName.message}</p>}
              </motion.div>

              {/* CPF / CNPJ */}
              <motion.div variants={fadeUp} className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  {accountType === 'owner' ? 'CNPJ da academia' : 'CPF'}
                  {accountType === 'student' && (
                    <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
                  )}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={document}
                  placeholder={accountType === 'owner' ? '00.000.000/0000-00' : '000.000.000-00'}
                  autoComplete="off"
                  onChange={(e) => {
                    setDocumentError(null)
                    setDocument(accountType === 'owner' ? maskCNPJ(e.target.value) : maskCPF(e.target.value))
                  }}
                  className={cn('field', documentError && 'border-destructive/60 focus:ring-destructive/40')}
                />
                {documentError && <p className="text-xs text-red-400">{documentError}</p>}
              </motion.div>

              {/* Email */}
              <motion.div variants={fadeUp}className="space-y-1.5">
                <label className="text-sm font-medium">E-mail</label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="seu@email.com"
                  autoComplete="email"
                  className={cn('field', errors.email && 'border-destructive/60')}
                />
                {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
              </motion.div>

              {/* Password */}
              <motion.div variants={fadeUp}className="space-y-1.5">
                <label className="text-sm font-medium">Senha</label>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className={cn('field pr-11', errors.password && 'border-destructive/60')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {password && (
                  <div className="space-y-1.5">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={cn(
                            'flex-1 h-1 rounded-full transition-all duration-300',
                            i <= strength ? strengthColors[strength] ?? 'bg-surface-300' : 'bg-surface-200'
                          )}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Força: <span className="text-foreground font-medium">{strengthLabels[strength]}</span>
                    </p>
                  </div>
                )}
                {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
              </motion.div>

              {/* Confirm Password */}
              <motion.div variants={fadeUp}className="space-y-1.5">
                <label className="text-sm font-medium">Confirmar senha</label>
                <div className="relative">
                  <input
                    {...register('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className={cn('field pr-11', errors.confirmPassword && 'border-destructive/60')}
                  />
                  {password && watch('confirmPassword') === password ? (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-emerald-400" />
                    </div>
                  ) : (
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>
                {errors.confirmPassword && <p className="text-xs text-red-400">{errors.confirmPassword.message}</p>}
              </motion.div>

              {/* Terms */}
              <motion.div variants={fadeUp}>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative mt-0.5 flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={cn(
                      'w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200',
                      termsAccepted
                        ? 'bg-brand-500 border-brand-500'
                        : 'border-border/60 bg-surface-100 group-hover:border-brand-500/50'
                    )}>
                      {termsAccepted && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground leading-relaxed">
                    Li e concordo com os{' '}
                    <Link href="/termos" target="_blank" className="text-brand-400 hover:underline font-medium">
                      Termos de Uso
                    </Link>
                    {' '}e com a{' '}
                    <Link href="/privacidade" target="_blank" className="text-brand-400 hover:underline font-medium">
                      Política de Privacidade
                    </Link>
                    {' '}do GymFlow.
                  </span>
                </label>
              </motion.div>

              {/* Submit */}
              <motion.div variants={fadeUp}>
                <button
                  type="submit"
                  disabled={isLoading || !termsAccepted}
                  className="w-full btn-primary py-3.5 rounded-xl font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar conta gratuita'}
                </button>
              </motion.div>
            </motion.form>

            <p className="text-center text-sm text-muted-foreground">
              Já tem uma conta?{' '}
              <Link href="/login" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
                Fazer login
              </Link>
            </p>
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  )
}

export default function CadastroPage() {
  return (
    <Suspense>
      <CadastroInner />
    </Suspense>
  )
}
