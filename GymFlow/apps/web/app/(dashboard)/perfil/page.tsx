'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Camera, Save, Loader2, CheckCircle2,
  Dumbbell, CalendarDays, TrendingUp, Flame,
  Pencil, X, Phone, Target, Ruler, Weight,
  ChevronDown,
} from 'lucide-react'
import { toast } from 'sonner'

import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { StudentBioView } from '@/components/bioimpedance/student-bio-view'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types'

// ─── animation variants ────────────────────────────────────────────────────
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
}

// ─── helpers ───────────────────────────────────────────────────────────────
function getInitials(name?: string | null) {
  if (!name) return 'U'
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
}

function calcAge(birthDate?: string | null): number | null {
  if (!birthDate) return null
  const diff = Date.now() - new Date(birthDate).getTime()
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000))
}

function calcIMC(weight?: number | null, height?: number | null): string {
  if (!weight || !height) return '—'
  const imc = weight / ((height / 100) ** 2)
  return imc.toFixed(1)
}

function imcLabel(imc: string): { label: string; color: string } {
  const v = parseFloat(imc)
  if (isNaN(v)) return { label: '—', color: 'text-muted-foreground' }
  if (v < 18.5) return { label: 'Abaixo do peso', color: 'text-cyan-400' }
  if (v < 25)   return { label: 'Peso normal',    color: 'text-emerald-400' }
  if (v < 30)   return { label: 'Sobrepeso',      color: 'text-amber-400' }
  return          { label: 'Obesidade',            color: 'text-red-400' }
}

// ─── types ─────────────────────────────────────────────────────────────────
interface Stats {
  totalWorkouts: number
  activeDays: number
  currentStreak: number
  totalVolume: number
}

// ─── field wrapper ─────────────────────────────────────────────────────────
function Field({
  label, value, editing, children,
}: {
  label: string
  value: string
  editing: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      {editing ? children : (
        <p className="text-sm font-medium text-foreground">{value || '—'}</p>
      )}
    </div>
  )
}

// ─── main page ─────────────────────────────────────────────────────────────
export default function PerfilPage() {
  const { profile: storeProfile, setProfile, currentAcademy, currentRole } = useAuthStore()
  const isStudent = currentRole === 'student'
  const supabase = createClient()

  const [profile, setLocalProfile] = useState<Profile | null>(storeProfile)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [stats, setStats] = useState<Stats>({ totalWorkouts: 0, activeDays: 0, currentStreak: 0, totalVolume: 0 })
  const [loadingStats, setLoadingStats] = useState(true)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // form state (draft while editing)
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    birth_date: '',
    gender: '',
    height_cm: '',
    weight_kg: '',
    goal: '',
    bio: '',
  })

  // sync profile from store
  useEffect(() => {
    if (storeProfile) {
      setLocalProfile(storeProfile)
      setForm({
        full_name:  storeProfile.full_name  ?? '',
        phone:      storeProfile.phone      ?? '',
        birth_date: storeProfile.birth_date ?? '',
        gender:     storeProfile.gender     ?? '',
        height_cm:  storeProfile.height_cm  != null ? String(storeProfile.height_cm) : '',
        weight_kg:  storeProfile.weight_kg  != null ? String(storeProfile.weight_kg) : '',
        goal:       storeProfile.goal       ?? '',
        bio:        storeProfile.bio        ?? '',
      })
    }
  }, [storeProfile])

  // load stats
  const loadStats = useCallback(async () => {
    if (!currentAcademy || !storeProfile) { setLoadingStats(false); return }
    setLoadingStats(true)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('workout_logs')
      .select('id, created_at, completed_at, set_logs(weight_kg, reps_done)')
      .eq('academy_id', currentAcademy.id)
      .eq('student_id', storeProfile.id)
      .not('completed_at', 'is', null)
      .order('created_at', { ascending: false })

    if (!data) { setLoadingStats(false); return }

    const logs = data as Array<{
      id: string
      created_at: string
      completed_at: string
      set_logs: Array<{ weight_kg: number | null; reps_done: number | null }>
    }>

    const totalWorkouts = logs.length

    const uniqueDays = new Set(
      logs.map((l) => new Date(l.created_at).toLocaleDateString('pt-BR'))
    ).size

    // streak: consecutive days with at least one workout (descending)
    let streak = 0
    let cursor = new Date(); cursor.setHours(0, 0, 0, 0)
    const daySet = new Set(
      logs.map((l) => new Date(l.created_at).toLocaleDateString('pt-BR'))
    )
    while (true) {
      const key = cursor.toLocaleDateString('pt-BR')
      if (daySet.has(key)) {
        streak++
        cursor.setDate(cursor.getDate() - 1)
      } else break
    }

    const totalVolume = logs.reduce((acc, l) =>
      acc + l.set_logs.reduce((a, s) => a + (s.weight_kg ?? 0) * (s.reps_done ?? 0), 0)
    , 0)

    setStats({ totalWorkouts, activeDays: uniqueDays, currentStreak: streak, totalVolume: Math.round(totalVolume) })
    setLoadingStats(false)
  }, [currentAcademy, storeProfile])

  useEffect(() => { void loadStats() }, [loadStats])

  // ── save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!profile) return
    setSaving(true)

    const patch = {
      full_name:  form.full_name  || null,
      phone:      form.phone      || null,
      birth_date: form.birth_date || null,
      gender:     form.gender     || null,
      height_cm:  form.height_cm  ? parseFloat(form.height_cm)  : null,
      weight_kg:  form.weight_kg  ? parseFloat(form.weight_kg)  : null,
      goal:       form.goal       || null,
      bio:        form.bio        || null,
      updated_at: new Date().toISOString(),
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('profiles')
      .update(patch)
      .eq('id', profile.id)
      .select()
      .single()

    if (error) {
      toast.error('Erro ao salvar perfil.')
    } else {
      setLocalProfile(data)
      setProfile(data)
      setEditing(false)
      toast.success('Perfil atualizado!')
    }
    setSaving(false)
  }

  const handleCancel = () => {
    if (!profile) return
    setForm({
      full_name:  profile.full_name  ?? '',
      phone:      profile.phone      ?? '',
      birth_date: profile.birth_date ?? '',
      gender:     profile.gender     ?? '',
      height_cm:  profile.height_cm  != null ? String(profile.height_cm) : '',
      weight_kg:  profile.weight_kg  != null ? String(profile.weight_kg) : '',
      goal:       profile.goal       ?? '',
      bio:        profile.bio        ?? '',
    })
    setEditing(false)
  }

  // ── avatar upload (via API server-side para validação segura) ─────────────
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    setUploadingAvatar(true)

    const form = new FormData()
    form.append('file', file)

    const res = await fetch('/api/upload/avatar', { method: 'POST', body: form })

    if (!res.ok) {
      const err = await res.json() as { error?: string }
      toast.error(err.error ?? 'Erro ao enviar imagem.')
      setUploadingAvatar(false)
      return
    }

    const { avatarUrl } = await res.json() as { avatarUrl: string }
    const updated = { ...profile, avatar_url: avatarUrl }
    setLocalProfile(updated as typeof profile)
    setProfile(updated as typeof profile)
    toast.success('Foto atualizada!')
    setUploadingAvatar(false)
  }

  // ── derived ───────────────────────────────────────────────────────────────
  const imc = calcIMC(profile?.weight_kg, profile?.height_cm)
  const { label: imcLabelText, color: imcColor } = imcLabel(imc)
  const age = calcAge(profile?.birth_date)

  const GOAL_OPTIONS = [
    'Hipertrofia', 'Emagrecimento', 'Condicionamento', 'Força',
    'Reabilitação', 'Saúde geral', 'Outro',
  ]

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6 max-w-2xl">

      {/* ── Header ── */}
      <motion.div variants={fadeUp} className="flex items-start justify-between gap-4">
        <div>
          <h2 className="section-title">Meu Perfil</h2>
          <p className="section-subtitle mt-1">Suas informações pessoais e stats</p>
        </div>
        <AnimatePresence mode="wait">
          {editing ? (
            <motion.div
              key="edit-actions"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex gap-2"
            >
              <button onClick={handleCancel} className="btn-secondary flex items-center gap-1.5 text-sm px-3 py-2">
                <X className="w-3.5 h-3.5" /> Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary flex items-center gap-1.5 text-sm px-3 py-2"
              >
                {saving
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Save className="w-3.5 h-3.5" />}
                Salvar
              </button>
            </motion.div>
          ) : (
            <motion.button
              key="edit-btn"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={() => setEditing(true)}
              className="btn-secondary flex items-center gap-1.5 text-sm px-3 py-2"
            >
              <Pencil className="w-3.5 h-3.5" /> Editar
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Avatar + nome ── */}
      <motion.div variants={fadeUp} className="glass rounded-2xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-brand-500/30">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name ?? 'Avatar'} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-brand-500/40 to-cyan-500/40 flex items-center justify-center">
                <span className="text-2xl font-bold text-brand-300">
                  {getInitials(profile?.full_name)}
                </span>
              </div>
            )}
          </div>
          {/* Upload btn */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="absolute -bottom-2 -right-2 w-7 h-7 rounded-lg bg-brand-500 hover:bg-brand-400 text-white flex items-center justify-center shadow-lg transition-all"
            title="Trocar foto"
          >
            {uploadingAvatar
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Camera className="w-3.5 h-3.5" />}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>

        {/* Nome + bio */}
        <div className="flex-1 w-full space-y-3">
          <Field label="Nome completo" value={profile?.full_name ?? ''} editing={editing}>
            <input
              className="field w-full text-sm"
              value={form.full_name}
              onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              placeholder="Seu nome"
            />
          </Field>
          <Field label="Bio" value={profile?.bio ?? ''} editing={editing}>
            <textarea
              className="field w-full text-sm resize-none"
              rows={2}
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              placeholder="Conte um pouco sobre você..."
            />
          </Field>
        </div>
      </motion.div>

      {/* ── Stats rápidos — apenas alunos ── */}
      {isStudent && <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            icon: Dumbbell,
            label: 'Treinos',
            value: loadingStats ? '…' : String(stats.totalWorkouts),
            color: 'text-brand-400',
            bg: 'bg-brand-500/10',
          },
          {
            icon: CalendarDays,
            label: 'Dias ativos',
            value: loadingStats ? '…' : String(stats.activeDays),
            color: 'text-cyan-400',
            bg: 'bg-cyan-500/10',
          },
          {
            icon: Flame,
            label: 'Sequência',
            value: loadingStats ? '…' : `${stats.currentStreak}d`,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10',
          },
          {
            icon: TrendingUp,
            label: 'Volume total',
            value: loadingStats ? '…' : stats.totalVolume >= 1000
              ? `${(stats.totalVolume / 1000).toFixed(0)}t`
              : `${stats.totalVolume}kg`,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
          },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="glass rounded-2xl p-4 flex flex-col items-center gap-2">
            <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center', bg)}>
              <Icon className={cn('w-4 h-4', color)} />
            </div>
            <p className={cn('font-display font-bold text-lg leading-none', color)}>{value}</p>
            <p className="text-[11px] text-muted-foreground">{label}</p>
          </div>
        ))}
      </motion.div>}

      {/* ── Dados pessoais ── */}
      <motion.div variants={fadeUp} className="glass rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <User className="w-4 h-4 text-brand-400" />
          <h3 className="font-display font-bold text-sm">Dados pessoais</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          {/* Telefone */}
          <Field label="Telefone" value={profile?.phone ?? ''} editing={editing}>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                className="field w-full text-sm pl-9"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="(11) 99999-9999"
              />
            </div>
          </Field>

          {/* Nascimento */}
          <Field
            label="Data de nascimento"
            value={profile?.birth_date
              ? `${new Date(profile.birth_date).toLocaleDateString('pt-BR')}${age ? ` · ${age} anos` : ''}`
              : ''}
            editing={editing}
          >
            <input
              type="date"
              className="field w-full text-sm"
              value={form.birth_date}
              onChange={(e) => setForm((f) => ({ ...f, birth_date: e.target.value }))}
            />
          </Field>

          {/* Gênero */}
          <Field
            label="Gênero"
            value={profile?.gender === 'male' ? 'Masculino' : profile?.gender === 'female' ? 'Feminino' : profile?.gender === 'other' ? 'Outro' : ''}
            editing={editing}
          >
            <div className="relative">
              <select
                className="field w-full text-sm appearance-none pr-8"
                value={form.gender}
                onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
              >
                <option value="">Selecionar</option>
                <option value="male">Masculino</option>
                <option value="female">Feminino</option>
                <option value="other">Outro</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            </div>
          </Field>

          {/* Objetivo — apenas alunos e personais */}
          {isStudent && <Field label="Objetivo" value={profile?.goal ?? ''} editing={editing}>
            <div className="relative">
              <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <select
                className="field w-full text-sm appearance-none pl-9 pr-8"
                value={form.goal}
                onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))}
              >
                <option value="">Selecionar</option>
                {GOAL_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            </div>
          </Field>}
        </div>
      </motion.div>

      {/* ── Dados físicos — apenas alunos ── */}
      {isStudent && <motion.div variants={fadeUp} className="glass rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <Ruler className="w-4 h-4 text-cyan-400" />
          <h3 className="font-display font-bold text-sm">Dados físicos</h3>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          {/* Altura */}
          <Field
            label="Altura"
            value={profile?.height_cm ? `${profile.height_cm} cm` : ''}
            editing={editing}
          >
            <div className="relative">
              <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="number"
                className="field w-full text-sm pl-9"
                value={form.height_cm}
                onChange={(e) => setForm((f) => ({ ...f, height_cm: e.target.value }))}
                placeholder="170"
                min={100}
                max={250}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">cm</span>
            </div>
          </Field>

          {/* Peso */}
          <Field
            label="Peso"
            value={profile?.weight_kg ? `${profile.weight_kg} kg` : ''}
            editing={editing}
          >
            <div className="relative">
              <Weight className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="number"
                className="field w-full text-sm pl-9"
                value={form.weight_kg}
                onChange={(e) => setForm((f) => ({ ...f, weight_kg: e.target.value }))}
                placeholder="70"
                min={30}
                max={300}
                step={0.1}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">kg</span>
            </div>
          </Field>
        </div>

        {/* IMC card (sempre visível, calculado em tempo real) */}
        {(profile?.height_cm || form.height_cm) && (profile?.weight_kg || form.weight_kg) && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 flex items-center gap-4 p-4 rounded-xl bg-surface-200/60 border border-border/30"
          >
            <div className="flex-1">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5">IMC calculado</p>
              <p className="font-display font-bold text-2xl leading-none">
                {editing
                  ? calcIMC(
                      form.weight_kg ? parseFloat(form.weight_kg) : null,
                      form.height_cm ? parseFloat(form.height_cm) : null,
                    )
                  : imc}
              </p>
            </div>
            <div className="text-right">
              <p className={cn('text-sm font-semibold', editing
                ? imcLabel(calcIMC(
                    form.weight_kg ? parseFloat(form.weight_kg) : null,
                    form.height_cm ? parseFloat(form.height_cm) : null,
                  )).color
                : imcColor
              )}>
                {editing
                  ? imcLabel(calcIMC(
                      form.weight_kg ? parseFloat(form.weight_kg) : null,
                      form.height_cm ? parseFloat(form.height_cm) : null,
                    )).label
                  : imcLabelText}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Índice de Massa Corporal</p>
            </div>
          </motion.div>
        )}
      </motion.div>}

      {/* ── Bioimpedância & Medidas — apenas alunos ── */}
      {isStudent && profile && (
        <motion.div variants={fadeUp}>
          <StudentBioView studentId={profile.id} />
        </motion.div>
      )}

      {/* ── Save confirmation visual ── */}
      <AnimatePresence>
        {saving && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed bottom-6 right-6 flex items-center gap-2 glass px-4 py-3 rounded-xl border border-brand-500/30 shadow-xl text-sm font-medium"
          >
            <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
            Salvando…
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
