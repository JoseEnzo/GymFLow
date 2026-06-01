'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, Check } from 'lucide-react'
import { toast } from 'sonner'

import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const schema = z.object({
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

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  }),
}

export default function RedefinirSenhaPage() {
  const router = useRouter()
  const supabase = createClient()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const password = watch('password', '')
  const confirmPassword = watch('confirmPassword', '')

  async function onSubmit(data: FormData) {
    setIsLoading(true)
    setServerError(null)
    try {
      const { error } = await supabase.auth.updateUser({ password: data.password })
      if (error) throw error
      setDone(true)
      toast.success('Senha redefinida com sucesso!')
      setTimeout(() => router.push('/dashboard'), 2000)
    } catch (err: unknown) {
      setServerError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  if (done) {
    return (
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-5 py-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto border border-emerald-500/20"
        >
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </motion.div>
        <div>
          <h2 className="font-display font-bold text-xl">Senha redefinida!</h2>
          <p className="text-sm text-muted-foreground mt-1">Redirecionando para o dashboard...</p>
        </div>
        <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" />
          Aguarde...
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={fadeUp} custom={0} className="space-y-1.5">
        <h1 className="text-2xl font-display font-bold">Nova senha</h1>
        <p className="text-sm text-muted-foreground">
          Escolha uma senha forte para proteger sua conta.
        </p>
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
          <label className="text-sm font-medium">Nova senha</label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="new-password"
              autoFocus
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
          {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
        </motion.div>

        <motion.div variants={fadeUp} custom={2} className="space-y-1.5">
          <label className="text-sm font-medium">Confirmar senha</label>
          <div className="relative">
            <input
              {...register('confirmPassword')}
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              className={cn('field pr-11', errors.confirmPassword && 'border-destructive/60')}
            />
            {password && confirmPassword === password && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Check className="w-3 h-3 text-emerald-400" />
              </div>
            )}
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-red-400">{errors.confirmPassword.message}</p>
          )}
        </motion.div>

        <motion.div variants={fadeUp} custom={3}>
          <button
            type="submit"
            disabled={isLoading || !password}
            className="w-full btn-primary py-3.5 rounded-xl font-semibold text-sm"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Redefinir senha'
            )}
          </button>
        </motion.div>
      </form>
    </motion.div>
  )
}
