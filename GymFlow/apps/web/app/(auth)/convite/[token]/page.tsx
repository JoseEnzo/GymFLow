'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, AlertCircle, CheckCircle2, Dumbbell } from 'lucide-react'
import { toast } from 'sonner'

import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'

interface InviteDetails {
  academyName: string
  academySlug: string
  role: 'personal' | 'student'
  code: string
  expiresAt: string | null
  usesCount: number
}

export default function ConvitePage() {
  const params = useParams()
  const router = useRouter()
  const token = params['token'] as string
  const { profile } = useAuth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any

  const [invite, setInvite] = useState<InviteDetails | null>(null)
  const [status, setStatus] = useState<'loading' | 'found' | 'accepting' | 'done' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    void loadInvite()
  }, [token])

  async function doAccept(inviteData: InviteDetails, user: { id: string }) {
    setStatus('accepting')
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: academyData } = await (supabase as any)
        .from('academies')
        .select('id')
        .eq('slug', inviteData.academySlug)
        .single()

      if (!academyData) throw new Error('Academia não encontrada')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: memberError } = await (supabase as any)
        .from('academy_members')
        .upsert({
          academy_id: academyData.id,
          user_id: user.id,
          role: inviteData.role,
          is_active: true,
          joined_at: new Date().toISOString(),
        }, { onConflict: 'academy_id,user_id' })

      if (memberError) throw memberError

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('invites')
        .update({ uses_count: inviteData.usesCount + 1 })
        .eq('token', token)

      setStatus('done')
      toast.success(`Você entrou para ${inviteData.academyName}!`)
      setTimeout(() => router.push('/dashboard'), 2000)
    } catch (err: unknown) {
      setError((err as Error).message)
      setStatus('error')
    }
  }

  async function loadInvite() {
    setStatus('loading')
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('invites')
        .select('*, academy:academies(name, slug)')
        .eq('token', token)
        .eq('is_active', true)
        .single()

      if (error || !data) throw new Error('Convite não encontrado ou expirado')

      const academy = data.academy as { name: string; slug: string } | null
      if (!academy) throw new Error('Academia não encontrada')

      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        throw new Error('Este convite expirou')
      }

      if (data.uses_limit && data.uses_count >= data.uses_limit) {
        throw new Error('Este convite já foi utilizado')
      }

      const inviteDetails: InviteDetails = {
        academyName: academy.name,
        academySlug: academy.slug,
        role: data.role,
        code: data.code,
        expiresAt: data.expires_at,
        usesCount: data.uses_count ?? 0,
      }
      setInvite(inviteDetails)

      // Se já estiver logado, aceita automaticamente
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await doAccept(inviteDetails, user)
      } else {
        setStatus('found')
      }
    } catch (err: unknown) {
      setError((err as Error).message)
      setStatus('error')
    }
  }

  async function acceptInvite() {
    if (!invite) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push(`/cadastro?token=${token}`)
      return
    }
    await doAccept(invite, user)
  }

  const roleLabel = invite?.role === 'personal' ? 'Personal Trainer' : 'Aluno'

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background bg-mesh">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md glass rounded-3xl p-8 border border-border/60 shadow-glow"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-1">
            <div className="relative flex items-center justify-center w-8 h-8">
              <div className="absolute inset-0 rounded-lg bg-brand-500 blur-md opacity-60" />
              <div className="relative rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 p-1.5">
                <Dumbbell className="w-4 h-4 text-white" />
              </div>
            </div>
            <span className="font-display font-bold text-lg">
              Gym<span className="text-brand-400">Flow</span>
            </span>
          </div>
        </div>

        <AnimatePresence mode="wait">

          {/* Loading state */}
          {status === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center gap-4 py-8"
            >
              <div className="w-12 h-12 rounded-full border-2 border-brand-500/30 animate-spin border-t-brand-500" />
              <p className="text-sm text-muted-foreground">Validando convite...</p>
            </motion.div>
          )}

          {/* Error state */}
          {status === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="text-center space-y-4 py-8"
            >
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 15 }}
                className="w-14 h-14 rounded-full bg-destructive/15 flex items-center justify-center mx-auto"
              >
                <AlertCircle className="w-7 h-7 text-red-400" />
              </motion.div>
              <div>
                <h2 className="font-display font-bold text-lg">Convite inválido</h2>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
              <button
                onClick={() => router.push('/')}
                className="btn-secondary w-full py-3 rounded-xl text-sm"
              >
                Voltar ao início
              </button>
            </motion.div>
          )}

          {/* Found state */}
          {(status === 'found' || status === 'accepting') && invite && (
            <motion.div
              key="found"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6"
            >
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500/20 to-cyan-500/20 flex items-center justify-center mx-auto border border-brand-500/20">
                  <Dumbbell className="w-8 h-8 text-brand-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Você foi convidado para</p>
                  <h2 className="text-xl font-display font-bold mt-0.5">{invite.academyName}</h2>
                </div>
              </div>

              <div className="glass rounded-2xl p-4 space-y-3 border border-border/40">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Função</span>
                  <span className="badge-primary">{roleLabel}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Código</span>
                  <span className="font-mono font-bold text-brand-400 text-base tracking-widest">
                    {invite.code}
                  </span>
                </div>
                {invite.expiresAt && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Expira em</span>
                    <span className="text-foreground">
                      {new Date(invite.expiresAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
              </div>

              {profile ? (
                <div className="flex flex-col items-center gap-3 py-2">
                  <Loader2 className="w-5 h-5 animate-spin text-brand-400" />
                  <p className="text-sm text-muted-foreground text-center">
                    Entrando como <span className="text-foreground font-medium">{profile.full_name}</span>...
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={() => router.push(`/login?redirect=/convite/${token}`)}
                    className="w-full btn-primary py-3.5 rounded-xl font-semibold text-sm"
                  >
                    Fazer login e aceitar convite
                  </button>
                  <button
                    onClick={acceptInvite}
                    className="w-full btn-secondary py-3.5 rounded-xl font-semibold text-sm"
                  >
                    Criar conta nova
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* Done state */}
          {status === 'done' && (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="text-center space-y-5 py-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto border border-emerald-500/20"
              >
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </motion.div>
              <div>
                <h2 className="font-display font-bold text-xl">Bem-vindo!</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Você entrou para <span className="text-foreground font-medium">{invite?.academyName}</span>
                </p>
              </div>
              <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
                Redirecionando para o dashboard...
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  )
}
