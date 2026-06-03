'use client'

import { useState, Suspense, useRef, type ElementType } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Loader2, AlertCircle, Building2, Dumbbell, ArrowLeft, UserCheck, ChevronRight, Ticket, Check, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'
import { SocialButtons } from '@/components/auth/social-buttons'
import { Turnstile, type TurnstileRef } from '@/components/ui/turnstile'

type Role = 'owner' | 'personal' | 'student'

const schema = z.object({
  identifier: z.string().min(1, 'Campo obrigatório'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

type FormData = z.infer<typeof schema>

const ROLES: {
  key: Role
  label: string
  sublabel: string
  description: string
  credential: string
  icon: ElementType
  bg: string
  border: string
  hoverBorder: string
  iconBg: string
  iconColor: string
}[] = [
  {
    key: 'owner',
    label: 'Dono',
    sublabel: 'Academia / Estabelecimento',
    description: 'Gerencie sua academia, personais e alunos',
    credential: 'Acesso com CNPJ',
    icon: Building2,
    bg: 'bg-brand-500/8',
    border: 'border-brand-500/30',
    hoverBorder: 'hover:border-brand-500/60',
    iconBg: 'bg-brand-500/15',
    iconColor: 'text-brand-400',
  },
  {
    key: 'personal',
    label: 'Personal',
    sublabel: 'Treinador pessoal',
    description: 'Monte fichas, acompanhe alunos e resultados',
    credential: 'Acesso com CPF',
    icon: UserCheck,
    bg: 'bg-violet-500/8',
    border: 'border-violet-500/30',
    hoverBorder: 'hover:border-violet-500/60',
    iconBg: 'bg-violet-500/15',
    iconColor: 'text-violet-400',
  },
  {
    key: 'student',
    label: 'Aluno',
    sublabel: 'Praticante de atividade',
    description: 'Acesse seus treinos e acompanhe sua evolução',
    credential: 'Acesso com e-mail',
    icon: Dumbbell,
    bg: 'bg-indigo-500/8',
    border: 'border-indigo-500/30',
    hoverBorder: 'hover:border-indigo-500/60',
    iconBg: 'bg-indigo-500/15',
    iconColor: 'text-indigo-400',
  },
]

function maskCNPJ(v: string) {
  return v.replace(/\D/g, '').slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

function maskCPF(v: string) {
  return v.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2')
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  }),
}

function LoginInner() {
  const { signIn, signInWithProvider } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect')
  const roleParam = searchParams.get('role') as Role | null

  const [role, setRole] = useState<Role | null>(roleParam)
  const [step, setStep] = useState<'role' | 'invite' | 'form'>(roleParam ? 'form' : 'role')
  const [hasInvite, setHasInvite] = useState<boolean | null>(null)
  const [inviteCode, setInviteCode] = useState('')
  const [inviteSaving, setInviteSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [identifier, setIdentifier] = useState('')
  const turnstileRef = useRef<TurnstileRef>(null)

  const { register, handleSubmit, setValue, reset, formState: { errors } } =
    useForm<FormData>({ resolver: zodResolver(schema) })

  function handleRoleSelect(r: Role) {
    setRole(r)
    setServerError(null)
    setIdentifier('')
    setHasInvite(null)
    setInviteCode('')
    reset()
    setStep(r === 'personal' || r === 'student' ? 'invite' : 'form')
  }

  function handleBack() {
    if (roleParam) {
      router.back()
      return
    }
    if (step === 'form' && (role === 'personal' || role === 'student')) {
      setStep('invite')
      return
    }
    setRole(null)
    setStep('role')
    setServerError(null)
    setIdentifier('')
    reset()
  }

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
        .single()
      if (error || !data) { toast.error('Código inválido ou expirado.'); return }
      router.push(`/convite/${(data as { token: string }).token}`)
    } catch {
      toast.error('Erro ao verificar código. Tente novamente.')
    } finally {
      setInviteSaving(false)
    }
  }

  function handleIdentifierChange(e: React.ChangeEvent<HTMLInputElement>) {
    let v = e.target.value
    if (role === 'owner')    v = maskCNPJ(v)
    if (role === 'personal') v = maskCPF(v)
    setIdentifier(v)
    setValue('identifier', v)
  }

  async function onSubmit(data: FormData) {
    setIsLoading(true)
    setServerError(null)
    try {
      const token = (await turnstileRef.current?.getToken()) ?? ''

      let email = data.identifier

      if (role === 'owner' || role === 'personal') {
        // Lookup verifica o token Turnstile internamente (token é single-use).
        const res = await fetch('/api/auth/lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: data.identifier,
            type: role === 'owner' ? 'cnpj' : 'cpf',
            token,
          }),
        })
        const json = await res.json() as { email?: string; error?: string }
        if (!res.ok || !json.email) {
          setServerError(json.error ?? 'Credenciais inválidas')
          turnstileRef.current?.reset()
          return
        }
        email = json.email
      } else {
        // Student loga direto com email — verificação Turnstile sempre,
        // server decide se aceita (em dev sem TURNSTILE_SECRET_KEY libera).
        const res = await fetch('/api/turnstile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
        if (!res.ok) {
          const err = await res.json() as { error?: string }
          setServerError(err.error ?? 'Verificação de segurança falhou.')
          turnstileRef.current?.reset()
          return
        }
      }

      await signIn(email, data.password, redirect ?? undefined, role ?? undefined)
    } catch (err: unknown) {
      const msg = (err as Error).message
      setServerError(msg.includes('Invalid login credentials') ? 'Credenciais inválidas' : msg)
      turnstileRef.current?.reset()
    } finally {
      setIsLoading(false)
    }
  }

  /* ── Step 1: role selection ─────────────────────────────────────── */
  if (step === 'role') {
    return (
      <motion.div initial="hidden" animate="show" className="space-y-7">
        <motion.div variants={fadeUp} custom={0} className="space-y-1.5">
          <h1 className="text-2xl font-display font-bold">Bem-vindo de volta</h1>
          <p className="text-sm text-muted-foreground">Como você quer entrar?</p>
        </motion.div>

        <div className="space-y-3">
          {ROLES.map(({ key, label, description, credential, icon: Icon, bg, border, hoverBorder, iconBg, iconColor }, i) => (
            <motion.button
              key={key}
              variants={fadeUp}
              custom={i + 1}
              onClick={() => handleRoleSelect(key)}
              className={cn(
                'w-full flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-200',
                bg, border, hoverBorder
              )}
            >
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', iconBg)}>
                <Icon className={cn('w-6 h-6', iconColor)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-base">{label}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
                <p className={cn('text-xs mt-1 font-medium', iconColor)}>{credential}</p>
              </div>
              <ChevronRight className={cn('w-4 h-4 opacity-50 flex-shrink-0', iconColor)} />
            </motion.button>
          ))}
        </div>

        <motion.div variants={fadeUp} custom={4} className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/60" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-background px-3 text-muted-foreground">ou continue com</span>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} custom={5}>
          <SocialButtons onLogin={signInWithProvider} />
        </motion.div>

        <motion.p variants={fadeUp} custom={6} className="text-center text-sm text-muted-foreground">
          Não tem uma conta?{' '}
          <Link href="/cadastro" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
            Criar conta grátis
          </Link>
        </motion.p>

        <motion.p variants={fadeUp} custom={7} className="text-center text-sm text-muted-foreground">
          Recebeu um código de convite?{' '}
          <Link href="/codigo" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
            Entrar com código
          </Link>
        </motion.p>
      </motion.div>
    )
  }

  /* ── Step 2: invite question (personal / student) ───────────────── */
  if (step === 'invite' && role) {
    const roleInfo = ROLES.find(r => r.key === role)!
    return (
      <motion.div initial="hidden" animate="show" className="space-y-7">
        <motion.div variants={fadeUp} custom={0} className="space-y-3">
          <button onClick={handleBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <div className="flex items-center gap-3">
            <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', roleInfo.iconBg)}>
              <roleInfo.icon className={cn('w-5 h-5', roleInfo.iconColor)} />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold">Você tem um convite? 🎯</h1>
              <p className="text-xs text-muted-foreground">Entrando como {roleInfo.label}</p>
            </div>
          </div>
        </motion.div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setHasInvite(true)}
            className={cn('w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all duration-200',
              hasInvite === true ? 'border-emerald-500/50 bg-emerald-500/8' : 'border-border/60 hover:border-border hover:bg-surface-100')}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/15 flex-shrink-0">
              <Ticket className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Sim, tenho um código de convite</p>
              <p className="text-xs text-muted-foreground mt-0.5">Usar código para entrar na academia</p>
            </div>
            {hasInvite === true && <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0"><Check className="w-3 h-3 text-white" /></div>}
          </button>

          <button
            type="button"
            onClick={() => setHasInvite(false)}
            className={cn('w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all duration-200',
              hasInvite === false ? `${roleInfo.border} ${roleInfo.bg}` : 'border-border/60 hover:border-border hover:bg-surface-100')}
          >
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', roleInfo.iconBg)}>
              <roleInfo.icon className={cn('w-5 h-5', roleInfo.iconColor)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Não, já tenho conta</p>
              <p className="text-xs text-muted-foreground mt-0.5">Fazer login com minhas credenciais</p>
            </div>
            {hasInvite === false && <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0"><Check className="w-3 h-3 text-white" /></div>}
          </button>
        </div>

        {hasInvite === true && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3 overflow-hidden">
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

        {hasInvite === false && (
          <button
            type="button"
            onClick={() => setStep('form')}
            className="w-full btn-primary py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
          >
            Fazer login <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </motion.div>
    )
  }

  /* ── Step 3: login form ─────────────────────────────────────────── */
  const roleInfo = ROLES.find(r => r.key === role)!
  const idLabel       = role === 'owner' ? 'CNPJ' : role === 'personal' ? 'CPF' : 'E-mail'
  const idPlaceholder = role === 'owner' ? '00.000.000/0001-00' : role === 'personal' ? '000.000.000-00' : 'seu@email.com'
  const idType        = role === 'student' ? 'email' : 'text'

  return (
    <motion.div initial="hidden" animate="show" className="space-y-7">
      <motion.div variants={fadeUp} custom={0} className="space-y-3">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
        <div className="flex items-center gap-3">
          <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', roleInfo.iconBg)}>
            <roleInfo.icon className={cn('w-5 h-5', roleInfo.iconColor)} />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">Entrar como {roleInfo.label}</h1>
            <p className="text-xs text-muted-foreground">{roleInfo.description}</p>
          </div>
        </div>
      </motion.div>

      {serverError && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2.5 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-red-400 text-sm"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {serverError}
        </motion.div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <motion.div variants={fadeUp} custom={1} className="space-y-1.5">
          <label className="text-sm font-medium">{idLabel}</label>
          <input
            type={idType}
            placeholder={idPlaceholder}
            value={identifier}
            onChange={handleIdentifierChange}
            autoComplete={role === 'student' ? 'email' : 'off'}
            className={cn(
              'field',
              errors.identifier && 'border-destructive/60 focus:ring-destructive/40'
            )}
          />
          {errors.identifier && (
            <p className="text-xs text-red-400">{errors.identifier.message}</p>
          )}
        </motion.div>

        <motion.div variants={fadeUp} custom={2} className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Senha</label>
            <Link href="/recuperar-senha" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
              Esqueceu a senha?
            </Link>
          </div>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              className={cn(
                'field pr-11',
                errors.password && 'border-destructive/60 focus:ring-destructive/40'
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-400">{errors.password.message}</p>
          )}
        </motion.div>

        <Turnstile ref={turnstileRef} appearance="managed" />

        <motion.div variants={fadeUp} custom={3}>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary py-3.5 rounded-xl font-semibold text-sm"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Entrar'}
          </button>
        </motion.div>
      </form>

      {/* Footer links */}
      {role === 'student' && (
        <motion.p variants={fadeUp} custom={6} className="text-center text-sm text-muted-foreground">
          Não tem uma conta?{' '}
          <Link href="/cadastro" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
            Criar conta grátis
          </Link>
        </motion.p>
      )}

      {role === 'student' && (
        <motion.p variants={fadeUp} custom={7} className="text-center text-sm text-muted-foreground">
          Recebeu um código de convite?{' '}
          <Link href="/codigo" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
            Entrar com código
          </Link>
        </motion.p>
      )}

      {role === 'owner' && (
        <motion.p variants={fadeUp} custom={6} className="text-center text-sm text-muted-foreground">
          Ainda não tem academia?{' '}
          <Link href="/cadastro" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
            Cadastrar academia
          </Link>
        </motion.p>
      )}

      {role === 'personal' && (
        <motion.p variants={fadeUp} custom={6} className="text-center text-sm text-muted-foreground">
          Não tem uma conta?{' '}
          <Link href="/cadastro" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
            Criar conta grátis
          </Link>
        </motion.p>
      )}

      {role === 'personal' && (
        <motion.p variants={fadeUp} custom={7} className="text-center text-sm text-muted-foreground">
          Recebeu um código de convite?{' '}
          <Link href="/codigo" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
            Entrar com código
          </Link>
        </motion.p>
      )}
    </motion.div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  )
}
