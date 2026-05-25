'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import {
  User, Building2, Bell, CreditCard, Shield,
  Loader2, Check, ExternalLink, Eye, EyeOff,
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
    if (!isOwner) return
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
        <div key={key} className="glass rounded-xl p-4 flex items-center gap-4">
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
function PlanTab() {
  const { currentAcademy } = useAuthStore()
  const currentPlan = currentAcademy?.plan ?? 'free'

  const plans = [
    { id: 'free', name: 'Free', price: 'R$ 0', limit: '30 alunos · 1 personal', color: '#6366F1' },
    { id: 'starter', name: 'Starter', price: 'R$ 99/mês', limit: '100 alunos · 3 personais', color: '#06B6D4' },
    { id: 'pro', name: 'Pro', price: 'R$ 199/mês', limit: 'Ilimitado', color: '#10B981' },
  ]

  return (
    <div className="space-y-5 max-w-lg">
      <div className="glass rounded-2xl p-5 border border-brand-500/15">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-muted-foreground">Plano atual</p>
            <p className="font-display font-bold text-lg capitalize">{currentPlan}</p>
          </div>
          <span className="badge-primary capitalize">{currentPlan}</span>
        </div>
      </div>

      <div className="space-y-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={cn(
              'glass rounded-xl p-4 flex items-center gap-4 transition-all',
              currentPlan === plan.id ? 'border-brand-500/30 bg-brand-500/5' : 'hover:border-border'
            )}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm"
              style={{ background: `${plan.color}15`, color: plan.color, border: `1px solid ${plan.color}25` }}>
              {plan.name[0]}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{plan.name} — {plan.price}</p>
              <p className="text-xs text-muted-foreground">{plan.limit}</p>
            </div>
            {currentPlan === plan.id ? (
              <span className="badge-success text-[10px]">Atual</span>
            ) : (
              <button
                onClick={() => toast.info('Integração de pagamentos em breve.')}
                className="text-xs text-brand-400 font-semibold flex items-center gap-1 hover:underline"
              >
                Upgrade <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>
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
    </form>
  )
}

// ── Page ──────────────────────────────────────────────────
export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('perfil')

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
