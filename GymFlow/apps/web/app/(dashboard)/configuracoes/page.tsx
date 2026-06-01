'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import {
  User, Building2, Bell, CreditCard, Shield,
  Loader2, Check, ExternalLink, Eye, EyeOff,
  Download, Trash2, AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import { createClient } from '@/lib/supabase/client'

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
}

type Tab = 'perfil' | 'academia' | 'notificacoes' | 'plano' | 'seguranca'

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'perfil', label: 'Perfil', icon: User },
  { id: 'academia', label: 'Academia', icon: Building2 },
  { id: 'notificacoes', label: 'Notificações', icon: Bell },
  { id: 'plano', label: 'Plano e cobrança', icon: CreditCard },
  { id: 'seguranca', label: 'Segurança', icon: Shield },
]

// ── Perfil ────────────────────────────────────────────────
function PerfilTab() {
  const { profile, setProfile } = useAuthStore()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      full_name: profile?.full_name ?? '',
      phone: profile?.phone ?? '',
      goal: profile?.goal ?? '',
      bio: profile?.bio ?? '',
    },
  })

  useEffect(() => {
    reset({
      full_name: profile?.full_name ?? '',
      phone: profile?.phone ?? '',
      goal: profile?.goal ?? '',
      bio: profile?.bio ?? '',
    })
  }, [profile, reset])

  async function onSubmit(data: { full_name: string; phone: string; goal: string; bio: string }) {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('profiles')
        .update({
          full_name: data.full_name || null,
          phone: data.phone || null,
          goal: data.goal || null,
          bio: data.bio || null,
        })
        .eq('id', user.id)

      if (error) throw error

      setProfile({ ...profile!, ...data })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      toast.success('Perfil atualizado!')
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Erro ao salvar perfil.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-lg">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500/30 to-cyan-500/30 flex items-center justify-center border border-brand-500/20">
          <span className="text-xl font-bold text-brand-300">
            {(profile?.full_name ?? 'U').split(' ').slice(0, 2).map((n) => n[0]).join('')}
          </span>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Upload de foto disponível em breve</p>
        </div>
      </div>

      <div className="divider" />

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Nome completo</label>
          <input {...register('full_name')} className="field" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Telefone</label>
          <input {...register('phone')} placeholder="(11) 9xxxx-xxxx" className="field" />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Objetivo</label>
        <input {...register('goal')} placeholder="Ex: Hipertrofia, Perda de peso..." className="field" />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Bio</label>
        <textarea {...register('bio')} rows={3} placeholder="Conte um pouco sobre você..." className="field resize-none" />
      </div>

      <button type="submit" disabled={saving} className="btn-primary text-sm py-2.5 px-6 rounded-xl">
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
          saved ? <><Check className="w-3.5 h-3.5" /> Salvo!</> : 'Salvar alterações'}
      </button>
    </form>
  )
}

// ── Academia ──────────────────────────────────────────────
function AcademiaTab() {
  const { currentAcademy, setCurrentAcademy, currentRole, academies } = useAuthStore()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      name: currentAcademy?.name ?? '',
      email: currentAcademy?.email ?? '',
      phone: currentAcademy?.phone ?? '',
      address_city: currentAcademy?.address_city ?? '',
      address_state: currentAcademy?.address_state ?? '',
    },
  })

  useEffect(() => {
    reset({
      name: currentAcademy?.name ?? '',
      email: currentAcademy?.email ?? '',
      phone: currentAcademy?.phone ?? '',
      address_city: currentAcademy?.address_city ?? '',
      address_state: currentAcademy?.address_state ?? '',
    })
  }, [currentAcademy, reset])

  const isOwner = currentRole === 'owner'

  if (!currentAcademy) {
    return (
      <div className="text-center py-12">
        <Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Você não está em nenhuma academia.</p>
      </div>
    )
  }

  async function onSubmit(data: { name: string; email: string; phone: string; address_city: string; address_state: string }) {
    if (!isOwner || !currentAcademy) return
    setSaving(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('academies')
        .update({
          name: data.name,
          email: data.email || null,
          phone: data.phone || null,
          address_city: data.address_city || null,
          address_state: data.address_state || null,
        })
        .eq('id', currentAcademy.id)

      if (error) throw error

      const updated = { ...currentAcademy, ...data }
      setCurrentAcademy(updated, currentRole)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      toast.success('Academia atualizada!')
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-lg">
      <div className="glass rounded-xl p-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-brand-500/15 flex items-center justify-center">
          <Building2 className="w-4 h-4 text-brand-400" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Slug</p>
          <p className="text-sm font-mono font-semibold">{currentAcademy.slug}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Nome da academia</label>
        <input {...register('name', { required: true })} disabled={!isOwner} className="field" />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">E-mail</label>
          <input {...register('email')} type="email" disabled={!isOwner} placeholder="contato@academia.com" className="field" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Telefone</label>
          <input {...register('phone')} disabled={!isOwner} placeholder="(11) 9xxxx-xxxx" className="field" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Cidade</label>
          <input {...register('address_city')} disabled={!isOwner} placeholder="São Paulo" className="field" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Estado</label>
          <input {...register('address_state')} disabled={!isOwner} maxLength={2} placeholder="SP" className="field uppercase" />
        </div>
      </div>

      {!isOwner && (
        <p className="text-xs text-muted-foreground">Somente o proprietário pode editar os dados da academia.</p>
      )}

      {isOwner && (
        <button type="submit" disabled={saving} className="btn-primary text-sm py-2.5 px-6 rounded-xl">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
            saved ? <><Check className="w-3.5 h-3.5" /> Salvo!</> : 'Salvar alterações'}
        </button>
      )}

      {/* Multi-academy switcher */}
      {academies.length > 1 && (
        <div className="pt-2">
          <p className="text-xs text-muted-foreground font-medium mb-2">Suas academias</p>
          <div className="space-y-1.5">
            {academies.map(({ academy, role }) => (
              <button
                key={academy.id}
                type="button"
                onClick={() => setCurrentAcademy(academy, role)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all text-sm',
                  currentAcademy.id === academy.id
                    ? 'border-brand-500/30 bg-brand-500/5 text-brand-300'
                    : 'border-border/60 text-muted-foreground hover:bg-surface-100'
                )}
              >
                <Building2 className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 truncate">{academy.name}</span>
                <span className="text-[10px] opacity-60 capitalize">{role}</span>
                {currentAcademy.id === academy.id && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </form>
  )
}

// ── Notificações ──────────────────────────────────────────
const NOTIF_KEY = 'gymflow_notifications'

function NotificacoesTab() {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(NOTIF_KEY)
      return stored ? JSON.parse(stored) : {
        emailNewStudent: true,
        emailWorkoutCompleted: false,
        emailWeeklyReport: true,
        pushNewStudent: true,
        pushWorkoutReminder: false,
      }
    } catch {
      return { emailNewStudent: true, emailWorkoutCompleted: false, emailWeeklyReport: true, pushNewStudent: true, pushWorkoutReminder: false }
    }
  })

  type SettingKey = keyof typeof settings

  function toggle(key: SettingKey) {
    setSettings((s: typeof settings) => {
      const next = { ...s, [key]: !s[key] }
      try { localStorage.setItem(NOTIF_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }

  return (
    <div className="space-y-4 max-w-lg">
      {([
        { key: 'emailNewStudent' as SettingKey, label: 'Novo aluno cadastrado', sub: 'Receba por e-mail quando um novo aluno entrar', channel: 'E-mail' },
        { key: 'emailWeeklyReport' as SettingKey, label: 'Relatório semanal', sub: 'Resumo de frequência e treinos toda segunda', channel: 'E-mail' },
        { key: 'pushNewStudent' as SettingKey, label: 'Alerta de novo aluno', sub: 'Notificação push no celular', channel: 'Push' },
        { key: 'pushWorkoutReminder' as SettingKey, label: 'Lembrete de treino', sub: 'Notificação diária para os alunos', channel: 'Push' },
        { key: 'emailWorkoutCompleted' as SettingKey, label: 'Treino concluído', sub: 'Quando um aluno finaliza o treino', channel: 'E-mail' },
      ]).map(({ key, label, sub, channel }) => (
        <div key={key as string} className="glass rounded-xl p-4 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">{label}</p>
              <span className="badge text-[9px] py-0.5 px-1.5 bg-surface-200 text-muted-foreground border-0">{channel}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
          </div>
          <button
            onClick={() => toggle(key)}
            className={cn('relative rounded-full transition-all duration-300 flex-shrink-0', settings[key] ? 'bg-brand-500' : 'bg-surface-300')}
            style={{ width: '2.5rem', height: '1.375rem' }}
          >
            <span
              className={cn('absolute top-0.5 rounded-full bg-white shadow transition-all duration-300', settings[key] ? 'left-5' : 'left-0.5')}
              style={{ width: '1.125rem', height: '1.125rem' }}
            />
          </button>
        </div>
      ))}
      <p className="text-[11px] text-muted-foreground">As preferências de notificação são salvas localmente neste dispositivo.</p>
    </div>
  )
}

// ── Plano ─────────────────────────────────────────────────
interface StripeInvoice {
  id: string
  date: number
  amount: number
  status: string | null
  pdfUrl: string | null
}

const PLAN_ORDER = ['starter', 'pro'] as const

function PlanTab() {
  const { currentAcademy } = useAuthStore()
  const currentPlan = currentAcademy?.plan ?? 'starter'
  const status = currentAcademy?.subscription_status
  const hasSubscription = !!currentAcademy?.stripe_subscription_id

  const [loadingCheckout, setLoadingCheckout] = useState<string | null>(null)
  const [loadingPortal, setLoadingPortal] = useState(false)
  const [invoices, setInvoices] = useState<StripeInvoice[]>([])
  const [periodEnd, setPeriodEnd] = useState<string | null>(null)
  const [trialEnd, setTrialEnd] = useState<string | null>(null)
  const [loadingInvoices, setLoadingInvoices] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('success') === '1') {
      toast.success('Assinatura ativada! Bem-vindo ao plano pago.')
      window.history.replaceState({}, '', '/configuracoes?tab=plano')
    }
  }, [])

  useEffect(() => {
    if (!currentAcademy?.id) return
    setLoadingInvoices(true)
    fetch(`/api/billing/invoices?academyId=${currentAcademy.id}`)
      .then((r) => r.json())
      .then((d) => {
        setInvoices(d.invoices ?? [])
        setPeriodEnd(d.periodEnd ?? null)
        setTrialEnd(d.trialEnd ?? null)
      })
      .catch(() => {})
      .finally(() => setLoadingInvoices(false))
  }, [currentAcademy?.id])

  async function handleUpgrade(planId: 'starter' | 'pro') {
    if (!currentAcademy) return
    setLoadingCheckout(planId)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ academyId: currentAcademy.id, planId }),
      })
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      window.location.href = url
    } catch (err: unknown) {
      toast.error((err as Error).message)
      setLoadingCheckout(null)
    }
  }

  async function handlePortal() {
    if (!currentAcademy) return
    setLoadingPortal(true)
    try {
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ academyId: currentAcademy.id }),
      })
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      window.location.href = url
    } catch (err: unknown) {
      toast.error((err as Error).message)
    } finally {
      setLoadingPortal(false)
    }
  }

  function statusLabel() {
    if (status === 'trialing') {
      const endDate = trialEnd ?? currentAcademy?.trial_ends_at ?? null
      if (endDate) {
        const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86_400_000)
        if (days > 0) return `Trial — ${days} dia${days !== 1 ? 's' : ''} restante${days !== 1 ? 's' : ''}`
        return 'Trial expirado'
      }
      return 'Em período de trial'
    }
    if (status === 'past_due') return 'Pagamento pendente'
    if (status === 'canceled') return 'Cancelado'
    if (status === 'active' && periodEnd) {
      return `Renova em ${new Date(periodEnd).toLocaleDateString('pt-BR')}`
    }
    return 'Plano gratuito'
  }

  function statusColor() {
    if (status === 'trialing') return 'text-blue-400'
    if (status === 'past_due') return 'text-red-400'
    if (status === 'canceled') return 'text-muted-foreground'
    if (status === 'active') return 'text-emerald-400'
    return 'text-muted-foreground'
  }

  const plans: { id: string; name: string; price: string; limit: string; color: string }[] = [
    { id: 'starter', name: 'Starter', price: 'R$ 197/mês', limit: 'Até 50 alunos · Até 3 personais', color: '#06B6D4' },
    { id: 'pro',     name: 'Pro',     price: 'R$ 397/mês', limit: 'Alunos e personais ilimitados',   color: '#10B981' },
  ]

  return (
    <div className="space-y-5 max-w-lg">
      {/* Status card */}
      <div className="glass rounded-2xl p-5 border border-brand-500/15">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Plano atual</p>
            <p className="font-display font-bold text-lg capitalize">{currentPlan}</p>
            <p className={cn('text-xs mt-0.5', statusColor())}>{statusLabel()}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="badge-primary capitalize">{currentPlan}</span>
            {currentAcademy?.stripe_customer_id && (
              <button
                onClick={handlePortal}
                disabled={loadingPortal}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors disabled:opacity-50"
              >
                {loadingPortal
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : <ExternalLink className="w-3 h-3" />}
                Gerenciar assinatura
              </button>
            )}
          </div>
        </div>
        {status === 'past_due' && (
          <div className="mt-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
            Pagamento pendente — atualize seu cartão para manter o acesso.
          </div>
        )}
      </div>

      {/* Plan cards */}
      <div className="space-y-3">
        {plans.map((plan) => {
          const isCurrentPlan = currentPlan === plan.id
          const planRank = PLAN_ORDER.indexOf(plan.id as typeof PLAN_ORDER[number])
          const currentRank = PLAN_ORDER.indexOf(currentPlan as typeof PLAN_ORDER[number])
          const isUpgrade = planRank > currentRank
          const isDowngrade = planRank < currentRank

          return (
            <div
              key={plan.id}
              className={cn(
                'glass rounded-xl p-4 flex items-center gap-4 transition-all',
                isCurrentPlan ? 'border-brand-500/30 bg-brand-500/5' : 'hover:border-border'
              )}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm"
                style={{ background: `${plan.color}15`, color: plan.color, border: `1px solid ${plan.color}25` }}
              >
                {plan.name[0]}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{plan.name} — {plan.price}</p>
                <p className="text-xs text-muted-foreground">{plan.limit}</p>
              </div>
              {isCurrentPlan ? (
                <span className="badge-success text-[10px]">Atual</span>
              ) : isUpgrade ? (
                hasSubscription ? (
                  <button
                    onClick={handlePortal}
                    disabled={loadingPortal}
                    className="text-xs text-brand-400 font-semibold flex items-center gap-1 hover:underline disabled:opacity-50"
                  >
                    {loadingPortal ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                    Upgrade <ExternalLink className="w-3 h-3" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan.id as 'starter' | 'pro')}
                    disabled={loadingCheckout !== null}
                    className="text-xs text-brand-400 font-semibold flex items-center gap-1 hover:underline disabled:opacity-50"
                  >
                    {loadingCheckout === plan.id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                    Upgrade <ExternalLink className="w-3 h-3" />
                  </button>
                )
              ) : isDowngrade ? (
                <button
                  onClick={handlePortal}
                  disabled={loadingPortal || !currentAcademy?.stripe_customer_id}
                  className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors disabled:opacity-30"
                >
                  Downgrade
                </button>
              ) : null}
            </div>
          )
        })}
      </div>

      {/* Invoice history */}
      {(invoices.length > 0 || loadingInvoices) && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Histórico de faturas</p>
          {loadingInvoices ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="glass rounded-xl p-3 animate-pulse h-12" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {invoices.map((inv) => (
                <div key={inv.id} className="glass rounded-xl p-3 flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {new Date(inv.date * 1000).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(inv.amount / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                  <span className={cn(
                    'text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full',
                    inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' :
                    inv.status === 'open' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-muted text-muted-foreground'
                  )}>
                    {inv.status === 'paid' ? 'Pago' : inv.status === 'open' ? 'Aberto' : inv.status}
                  </span>
                  {inv.pdfUrl && (
                    <a
                      href={inv.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Segurança ─────────────────────────────────────────────
function SegurancaTab() {
  const supabase = createClient()
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [exporting, setExporting] = useState(false)
  const [showDangerZone, setShowDangerZone] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)

  async function handleExport() {
    setExporting(true)
    try {
      const res = await fetch('/api/account/export')
      if (!res.ok) throw new Error('Falha ao exportar dados')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `gymflow-dados-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Dados exportados com sucesso!')
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Erro ao exportar dados.')
    } finally {
      setExporting(false)
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== 'EXCLUIR') return
    setDeleting(true)
    try {
      const res = await fetch('/api/account/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: 'EXCLUIR' }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      await supabase.auth.signOut()
      window.location.href = '/login'
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Erro ao excluir conta.')
      setDeleting(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (form.newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (form.newPassword !== form.confirmPassword) {
      toast.error('As senhas não coincidem.')
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: form.newPassword })
      if (error) throw error
      setSaved(true)
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => setSaved(false), 3000)
      toast.success('Senha alterada com sucesso!')
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Erro ao alterar senha.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Nova senha</label>
        <div className="relative">
          <input
            type={showNew ? 'text' : 'password'}
            value={form.newPassword}
            onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
            placeholder="Mínimo 6 caracteres"
            className="field pr-10"
          />
          <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Confirmar nova senha</label>
        <div className="relative">
          <input
            type={showCurrent ? 'text' : 'password'}
            value={form.confirmPassword}
            onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
            placeholder="Repita a nova senha"
            className="field pr-10"
          />
          <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={saving || !form.newPassword || !form.confirmPassword}
        className="btn-primary text-sm py-2.5 px-6 rounded-xl"
      >
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
          saved ? <><Check className="w-3.5 h-3.5" /> Senha alterada!</> : 'Alterar senha'}
      </button>

      <div className="divider" />

      {/* Exportar dados */}
      <div>
        <p className="text-sm font-medium mb-1">Exportar meus dados</p>
        <p className="text-xs text-muted-foreground mb-3">
          Baixe uma cópia de todos os seus dados em formato JSON (LGPD Art. 18).
        </p>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="btn-secondary text-sm py-2.5 px-5 rounded-xl flex items-center gap-2"
        >
          {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          Exportar dados
        </button>
      </div>

      <div className="divider" />

      {/* Zona de perigo */}
      <div>
        <p className="text-sm font-medium text-red-400 mb-1 flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4" />
          Zona de perigo
        </p>
        <p className="text-xs text-muted-foreground mb-3">
          A exclusão é permanente e irreversível. Todos os seus dados, treinos e histórico serão removidos.
          Se você for proprietário de uma academia, ela também será excluída.
        </p>
        {!showDangerZone ? (
          <button
            type="button"
            onClick={() => setShowDangerZone(true)}
            className="flex items-center gap-2 text-sm text-red-400 border border-red-500/30 hover:bg-red-500/10 px-5 py-2.5 rounded-xl transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Excluir minha conta
          </button>
        ) : (
          <div className="space-y-3 p-4 rounded-xl border border-red-500/30 bg-red-500/5">
            <p className="text-xs text-muted-foreground">
              Digite <span className="font-mono font-bold text-red-400">EXCLUIR</span> para confirmar:
            </p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="EXCLUIR"
              className="field text-sm font-mono"
              autoComplete="off"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setShowDangerZone(false); setDeleteConfirm('') }}
                className="btn-secondary flex-1 text-sm py-2.5 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== 'EXCLUIR' || deleting}
                className="flex-1 text-sm py-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5"
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Excluir conta
              </button>
            </div>
          </div>
        )}
      </div>
    </form>
  )
}

// ── Page ──────────────────────────────────────────────────
export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('perfil')

  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get('tab') as Tab | null
    if (tab && TABS.some((t) => t.id === tab)) setActiveTab(tab)
  }, [])

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={fadeUp}>
        <h2 className="section-title">Configurações</h2>
        <p className="section-subtitle mt-1">Gerencie sua conta e preferências</p>
      </motion.div>

      <motion.div variants={fadeUp} className="flex gap-6 flex-col lg:flex-row">
        <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible flex-shrink-0 lg:w-48">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
                activeTab === id
                  ? 'bg-brand-500/10 text-brand-300 border border-brand-500/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-surface-100'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        <div className="flex-1 min-w-0">
          <div className="glass rounded-2xl p-6">
            {activeTab === 'perfil' && <PerfilTab />}
            {activeTab === 'academia' && <AcademiaTab />}
            {activeTab === 'notificacoes' && <NotificacoesTab />}
            {activeTab === 'plano' && <PlanTab />}
            {activeTab === 'seguranca' && <SegurancaTab />}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
