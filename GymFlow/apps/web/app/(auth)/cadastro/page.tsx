'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Loader2, AlertCircle, Check } from 'lucide-react'

import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

const schema = z.object({
  fullName: z.string().min(3, 'Nome muito curto'),
  email: z.string().email('E-mail inválido'),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Deve conter letra maiúscula')
    .regex(/[0-9]/, 'Deve conter número'),
  confirmPassword: z.string(),
  type: z.enum(['owner', 'student']),
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

export default function CadastroPage() {
  const { signUp } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get('token')

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'owner' },
  })

  useEffect(() => {
    if (inviteToken) setValue('type', 'student')
  }, [inviteToken, setValue])

  const password = watch('password', '')
  const selectedType = watch('type')
  const strength = passwordStrength(password)

  async function onSubmit(data: FormData) {
    setIsLoading(true)
    setServerError(null)
    try {
      const redirectTo = inviteToken ? `/convite/${inviteToken}` : undefined
      await signUp(data.email, data.password, data.fullName, data.type, redirectTo)
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

  const fadeUp = {
    hidden: { opacity: 0, y: 14 },
    show: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.06, duration: 0.45, ease: [0.16, 1, 0.3, 1] },
    }),
  }

  return (
    <motion.div initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp} custom={0} className="space-y-1.5">
        <h1 className="text-2xl font-display font-bold">Criar sua conta</h1>
        <p className="text-sm text-muted-foreground">
          {inviteToken ? 'Crie sua conta para aceitar o convite' : 'Grátis para sempre, sem cartão de crédito'}
        </p>
      </motion.div>

      {/* Invite banner */}
      {inviteToken && (
        <motion.div variants={fadeUp} custom={0.5}
          className="flex items-center gap-2.5 p-3.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm"
        >
          <Check className="w-4 h-4 flex-shrink-0" />
          Convite válido — após criar a conta você entrará automaticamente para a academia.
        </motion.div>
      )}

      {/* Account type */}
      <motion.div variants={fadeUp} custom={1} className="space-y-2">
        <label className="text-sm font-medium">Tipo de conta</label>
        <div className="grid grid-cols-2 gap-2">
          {([
            { value: 'owner', label: '🏢 Academia', desc: 'Dono ou gestor' },
            { value: 'student', label: '🎯 Aluno', desc: 'Via convite' },
          ] as const).map(({ value, label, desc }) => (
            <button
              key={value}
              type="button"
              onClick={() => setValue('type', value)}
              className={cn(
                'p-3 rounded-xl border text-left transition-all duration-200',
                selectedType === value
                  ? 'border-brand-500/50 bg-brand-500/8 text-foreground shadow-glow-sm'
                  : 'border-border/60 hover:border-border text-muted-foreground hover:bg-surface-100'
              )}
            >
              <p className="text-sm font-semibold">{label}</p>
              <p className="text-xs mt-0.5 opacity-70">{desc}</p>
            </button>
          ))}
        </div>
      </motion.div>

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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name */}
        <motion.div variants={fadeUp} custom={2} className="space-y-1.5">
          <label className="text-sm font-medium">Nome completo</label>
          <input
            {...register('fullName')}
            type="text"
            placeholder="João da Silva"
            autoComplete="name"
            className={cn('field', errors.fullName && 'border-destructive/60')}
          />
          {errors.fullName && (
            <p className="text-xs text-red-400">{errors.fullName.message}</p>
          )}
        </motion.div>

        {/* Email */}
        <motion.div variants={fadeUp} custom={3} className="space-y-1.5">
          <label className="text-sm font-medium">E-mail</label>
          <input
            {...register('email')}
            type="email"
            placeholder="seu@email.com"
            autoComplete="email"
            className={cn('field', errors.email && 'border-destructive/60')}
          />
          {errors.email && (
            <p className="text-xs text-red-400">{errors.email.message}</p>
          )}
        </motion.div>

        {/* Password */}
        <motion.div variants={fadeUp} custom={4} className="space-y-1.5">
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

          {/* Strength indicator */}
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

          {errors.password && (
            <p className="text-xs text-red-400">{errors.password.message}</p>
          )}
        </motion.div>

        {/* Confirm Password */}
        <motion.div variants={fadeUp} custom={5} className="space-y-1.5">
          <label className="text-sm font-medium">Confirmar senha</label>
          <div className="relative">
            <input
              {...register('confirmPassword')}
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              className={cn('field pr-11', errors.confirmPassword && 'border-destructive/60')}
            />
            {password && watch('confirmPassword') === password && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Check className="w-3 h-3 text-emerald-400" />
              </div>
            )}
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-red-400">{errors.confirmPassword.message}</p>
          )}
        </motion.div>

        {/* Terms */}
        <motion.div variants={fadeUp} custom={6}>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Ao criar a conta você aceita nossos{' '}
            <a href="#" className="text-brand-400 hover:underline">Termos de Uso</a>
            {' '}e{' '}
            <a href="#" className="text-brand-400 hover:underline">Política de Privacidade</a>.
          </p>
        </motion.div>

        {/* Submit */}
        <motion.div variants={fadeUp} custom={7}>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary py-3.5 rounded-xl font-semibold text-sm"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Criar conta gratuita'
            )}
          </button>
        </motion.div>
      </form>

      <motion.p variants={fadeUp} custom={8} className="text-center text-sm text-muted-foreground">
        Já tem uma conta?{' '}
        <Link href="/login" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
          Fazer login
        </Link>
      </motion.p>
    </motion.div>
  )
}
