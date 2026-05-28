'use client'

import { useState, Suspense, useRef } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Loader2, AlertCircle, Building2, UserCheck, Dumbbell, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'
import { Turnstile, type TurnstileRef } from '@/components/ui/turnstile'
import { maskCNPJ, maskCPF } from '@/lib/cnpj'

type Role = 'owner' | 'personal' | 'student'

const ROLES = [
  {
    value: 'owner' as const,
    icon: Building2,
    title: 'Dono de academia',
    description: 'Acesse com o CNPJ da sua academia',
    bg: 'bg-brand-500/8',
    border: 'border-brand-500/40',
    iconBg: 'bg-brand-500/15',
    iconColor: 'text-brand-400',
  },
  {
    value: 'personal' as const,
    icon: UserCheck,
    title: 'Personal trainer',
    description: 'Acesse com o seu CPF',
    bg: 'bg-violet-500/8',
    border: 'border-violet-500/40',
    iconBg: 'bg-violet-500/15',
    iconColor: 'text-violet-400',
  },
  {
    value: 'student' as const,
    icon: Dumbbell,
    title: 'Aluno',
    description: 'Acesse com o seu e-mail',
    bg: 'bg-indigo-500/8',
    border: 'border-indigo-500/40',
    iconBg: 'bg-indigo-500/15',
    iconColor: 'text-indigo-400',
  },
]

function LoginInner() {
  const { signIn, signInWithGoogle } = useAuth()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect')

  const [step, setStep] = useState<'role' | 'form'>('role')
  const [role, setRole] = useState<Role | null>(null)
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const turnstileRef = useRef<TurnstileRef>(null)

  function selectRole(r: Role) {
    setRole(r)
    setIdentifier('')
    setPassword('')
    setServerError(null)
    setStep('form')
  }

  function handleIdentifierChange(value: string) {
    setServerError(null)
    if (role === 'owner') setIdentifier(maskCNPJ(value))
    else if (role === 'personal') setIdentifier(maskCPF(value))
    else setIdentifier(value)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setServerError(null)

    try {
      // Turnstile check
      const token = await turnstileRef.current?.getToken()
      if (token !== '') {
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

      let emailToUse = identifier.trim()

      if (role === 'owner' || role === 'personal') {
        const res = await fetch('/api/auth/lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, type: role === 'owner' ? 'cnpj' : 'cpf' }),
        })
        const json = await res.json() as { email?: string; error?: string }
        if (!res.ok || !json.email) {
          setServerError(json.error ?? 'Credenciais não encontradas.')
          turnstileRef.current?.reset()
          return
        }
        emailToUse = json.email
      }

      await signIn(emailToUse, password, redirect ?? undefined)
    } catch (err: unknown) {
      const msg = (err as Error).message
      if (msg.includes('Invalid login credentials')) {
        setServerError('Credenciais inválidas')
      } else {
        setServerError(msg)
      }
      turnstileRef.current?.reset()
    } finally {
      setIsLoading(false)
    }
  }

  const selectedRole = ROLES.find((r) => r.value === role)

  const identifierLabel = role === 'owner' ? 'CNPJ da academia' : role === 'personal' ? 'CPF' : 'E-mail'
  const identifierPlaceholder = role === 'owner' ? '00.000.000/0000-00' : role === 'personal' ? '000.000.000-00' : 'seu@email.com'

  return (
    <motion.div initial="hidden" animate="show" className="space-y-6">
      <AnimatePresence mode="wait">

        {/* ── Etapa 0: escolha de perfil ── */}
        {step === 'role' && (
          <motion.div
            key="step-role"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            <div className="space-y-1.5">
              <h1 className="text-2xl font-display font-bold">Bem-vindo de volta</h1>
              <p className="text-sm text-muted-foreground">Como você quer entrar?</p>
            </div>

            <div className="space-y-3">
              {ROLES.map((r) => {
                const Icon = r.icon
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => selectRole(r.value)}
                    className={cn(
                      'w-full flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-200 group',
                      'border-border/60 hover:border-border bg-surface-100/50 hover:bg-surface-100'
                    )}
                  >
                    <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', r.iconBg)}>
                      <Icon className={cn('w-5 h-5', r.iconColor)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-base">{r.title}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{r.description}</p>
                    </div>
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

            {/* Google OAuth */}
            <button
              type="button"
              onClick={async () => {
                setIsGoogleLoading(true)
                try {
                  await signInWithGoogle()
                } catch {
                  toast.error('Erro ao entrar com Google')
                  setIsGoogleLoading(false)
                }
              }}
              disabled={isGoogleLoading}
              className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl border border-border/60 hover:bg-surface-100 transition-all text-sm font-medium disabled:opacity-60"
            >
              {isGoogleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Entrar com Google
                </>
              )}
            </button>

            <p className="text-center text-sm text-muted-foreground">
              Não tem uma conta?{' '}
              <Link href="/cadastro" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
                Criar conta grátis
              </Link>
            </p>
          </motion.div>
        )}

        {/* ── Etapa 1: formulário ── */}
        {step === 'form' && role && selectedRole && (
          <motion.div
            key="step-form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-5"
          >
            {/* Back + header */}
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => { setStep('role'); setServerError(null) }}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Voltar
              </button>
              <h1 className="text-2xl font-display font-bold">Entrar</h1>
              <p className="text-sm text-muted-foreground">Acesso como {selectedRole.title.toLowerCase()}</p>
            </div>

            {/* Role badge */}
            <div className={cn(
              'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border',
              selectedRole.bg, selectedRole.border, selectedRole.iconColor
            )}>
              <selectedRole.icon className="w-3.5 h-3.5" />
              {selectedRole.title}
            </div>

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

            <form onSubmit={onSubmit} className="space-y-4">
              {/* Identifier */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{identifierLabel}</label>
                <input
                  type={role === 'student' ? 'email' : 'text'}
                  inputMode={role === 'student' ? 'email' : 'numeric'}
                  value={identifier}
                  onChange={(e) => handleIdentifierChange(e.target.value)}
                  placeholder={identifierPlaceholder}
                  autoComplete={role === 'student' ? 'email' : 'off'}
                  className="field"
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Senha</label>
                  <Link
                    href="/recuperar-senha"
                    className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="field pr-11"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Turnstile ref={turnstileRef} appearance="managed" />

              <button
                type="submit"
                disabled={isLoading || !identifier || !password}
                className="w-full btn-primary py-3.5 rounded-xl font-semibold text-sm disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Entrar'}
              </button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Não tem uma conta?{' '}
              <Link href="/cadastro" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
                Criar conta grátis
              </Link>
            </p>
          </motion.div>
        )}

      </AnimatePresence>
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
