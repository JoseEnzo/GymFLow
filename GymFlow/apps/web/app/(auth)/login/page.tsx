'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

type FormData = z.infer<typeof schema>

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  }),
}

function LoginInner() {
  const { signIn, signInWithGoogle } = useAuth()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setIsLoading(true)
    setServerError(null)
    try {
      await signIn(data.email, data.password, redirect ?? undefined)
    } catch (err: unknown) {
      const msg = (err as Error).message
      if (msg.includes('Invalid login credentials')) {
        setServerError('E-mail ou senha inválidos')
      } else {
        setServerError(msg)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial="hidden"
      animate="show"
      className="space-y-7"
    >
      {/* Header */}
      <motion.div variants={fadeUp} custom={0} className="space-y-1.5">
        <h1 className="text-2xl font-display font-bold">Bem-vindo de volta</h1>
        <p className="text-sm text-muted-foreground">
          Entre na sua conta para continuar
        </p>
      </motion.div>

      {/* Error alert */}
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
        {/* Email */}
        <motion.div variants={fadeUp} custom={1} className="space-y-1.5">
          <label className="text-sm font-medium">E-mail</label>
          <input
            {...register('email')}
            type="email"
            placeholder="seu@email.com"
            autoComplete="email"
            className={cn(
              'field',
              errors.email && 'border-destructive/60 focus:ring-destructive/40'
            )}
          />
          {errors.email && (
            <p className="text-xs text-red-400">{errors.email.message}</p>
          )}
        </motion.div>

        {/* Password */}
        <motion.div variants={fadeUp} custom={2} className="space-y-1.5">
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

        {/* Submit */}
        <motion.div variants={fadeUp} custom={3}>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary py-3.5 rounded-xl font-semibold text-sm"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Entrar'
            )}
          </button>
        </motion.div>
      </form>

      {/* Divider */}
      <motion.div variants={fadeUp} custom={4} className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/60" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-3 text-muted-foreground">ou continue com</span>
        </div>
      </motion.div>

      {/* Google OAuth */}
      <motion.div variants={fadeUp} custom={5}>
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
      </motion.div>

      {/* Footer */}
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

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  )
}
