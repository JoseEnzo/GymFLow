'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Loader2, AlertCircle, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'

import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
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

export default function RecuperarSenhaPage() {
  const { resetPassword } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, getValues, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setIsLoading(true)
    setServerError(null)
    try {
      await resetPassword(data.email)
      setSent(true)
    } catch (err: unknown) {
      setServerError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  if (sent) {
    return (
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="text-center space-y-4 py-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto border border-emerald-500/20"
          >
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </motion.div>
          <div>
            <h1 className="text-xl font-display font-bold">E-mail enviado!</h1>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Enviamos as instruções para{' '}
              <span className="text-foreground font-medium">{getValues('email')}</span>.
              <br />Verifique sua caixa de entrada e spam.
            </p>
          </div>
          <Link
            href="/login"
            className="text-xs text-brand-400 hover:text-brand-300 flex items-center justify-center gap-1.5 mt-2 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" /> Voltar ao login
          </Link>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={fadeUp} custom={0} className="space-y-1.5">
        <h1 className="text-2xl font-display font-bold">Recuperar senha</h1>
        <p className="text-sm text-muted-foreground">
          Digite seu e-mail e enviaremos um link para redefinir sua senha.
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
          <label className="text-sm font-medium">E-mail</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              {...register('email')}
              type="email"
              placeholder="seu@email.com"
              autoComplete="email"
              autoFocus
              className={cn('field pl-10', errors.email && 'border-destructive/60')}
            />
          </div>
          {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
        </motion.div>

        <motion.div variants={fadeUp} custom={2}>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary py-3.5 rounded-xl font-semibold text-sm"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Enviar link de recuperação'
            )}
          </button>
        </motion.div>
      </form>

      <motion.div variants={fadeUp} custom={3}>
        <Link
          href="/login"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao login
        </Link>
      </motion.div>
    </motion.div>
  )
}
