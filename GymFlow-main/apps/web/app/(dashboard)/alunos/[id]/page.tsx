'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Dumbbell, Flame, Clock, Target, Scale,
  Ruler, ClipboardList, Loader2, Users, Plus, ChevronRight,
  Calendar,
} from 'lucide-react'
import Link from 'next/link'

import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'
import { BioimpedanceSection } from '@/components/bioimpedance/bioimpedance-section'
import { MeasurementsSection } from '@/components/bioimpedance/measurements-section'

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  }),
}

interface StudentProfile {
  id: string
  full_name: string | null
  email?: string
  phone: string | null
  goal: string | null
  bio: string | null
  weight_kg: number | null
  height_cm: number | null
  birth_date: string | null
  avatar_url: string | null
}

interface WorkoutSheetBasic {
  id: string
  name: string
  goal: string | null
  is_active: boolean
}

function getInitials(name: string | null) {
  if (!name) return 'A'
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
}

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { currentAcademy, currentRole } = useAuthStore()
  const isOwner    = currentRole === 'owner'
  const isPersonal = currentRole === 'personal'
  const supabase = createClient()

  const [student, setStudent] = useState<StudentProfile | null>(null)
  const [sheets, setSheets] = useState<WorkoutSheetBasic[]>([])
  const [totalWorkouts, setTotalWorkouts] = useState(0)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function load() {
      if (!currentAcademy) { setLoading(false); return }

      // Verify member belongs to this academy
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: memberList, error: memberError } = await (supabase as any)
        .from('academy_members')
        .select('user_id, role')
        .eq('academy_id', currentAcademy.id)
        .eq('user_id', id)
        .eq('is_active', true)
        .limit(1)

      if (memberError) console.warn('[aluno] erro ao buscar membro:', memberError?.message ?? memberError)
      const member = memberList?.[0]
      if (!member) { setNotFound(true); setLoading(false); return }

      // Load profile
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profileList, error: profileError } = await (supabase as any)
        .from('profiles')
        .select('id, full_name, phone, goal, bio, weight_kg, height_cm, birth_date, avatar_url')
        .eq('id', id)
        .limit(1)

      if (profileError) console.warn('[aluno] erro ao buscar perfil:', profileError?.message ?? profileError)
      // O membro pertence à academia: renderiza mesmo se o profile ainda não existir.
      setStudent(profileList?.[0] ?? { id, full_name: null, phone: null, goal: null, bio: null, weight_kg: null, height_cm: null, birth_date: null, avatar_url: null })

      // Load sheets assigned to this student
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: sheetsData, error: sheetsError } = await (supabase as any)
        .from('workout_sheets')
        .select('id, name, goal, is_active')
        .eq('academy_id', currentAcademy.id)
        .eq('student_id', id)
        .order('created_at', { ascending: false })

      if (sheetsError) console.warn('[aluno] erro ao buscar fichas:', sheetsError?.message ?? sheetsError)
      if (sheetsData) setSheets(sheetsData)

      // Count workout logs
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count, error: countError } = await (supabase as any)
        .from('workout_logs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', id)
        .eq('academy_id', currentAcademy.id)

      if (countError) console.warn('[aluno] erro ao contar treinos:', countError?.message ?? countError)
      setTotalWorkouts(count ?? 0)
      setLoading(false)
    }
    load()
  }, [id, currentAcademy])

  const colors = ['#6366F1', '#06B6D4', '#10B981', '#F59E0B', '#F97316', '#EC4899']
  const avatarColor = student?.full_name
    ? colors[student.full_name.charCodeAt(0) % colors.length]!
    : '#6366F1'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
      </div>
    )
  }

  if (notFound || !student) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 rounded-2xl bg-surface-200 flex items-center justify-center mb-4">
          <Users className="w-6 h-6 text-muted-foreground/40" />
        </div>
        <p className="font-semibold">Aluno não encontrado</p>
        <p className="text-sm text-muted-foreground mt-1">Este aluno não existe ou não pertence à sua academia.</p>
        <Link href="/alunos" className="btn-secondary text-sm py-2 px-4 rounded-xl mt-4 inline-flex">
          Voltar para alunos
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show" className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-surface-200 transition-all text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="section-title">Perfil do aluno</h2>
      </motion.div>

      {/* Profile card */}
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" className="glass rounded-2xl p-5">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg text-white flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}99)` }}
          >
            {getInitials(student.full_name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-lg truncate">
              {student.full_name ?? 'Aluno'}
            </p>
            {student.goal && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                <Target className="w-3 h-3" /> {student.goal}
              </p>
            )}
            {student.phone && (
              <p className="text-xs text-muted-foreground mt-0.5">{student.phone}</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-border/40">
          <div className="text-center">
            <p className="font-bold text-lg">{totalWorkouts}</p>
            <p className="text-[10px] text-muted-foreground">Treinos</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-lg">{sheets.filter((s) => s.is_active).length}</p>
            <p className="text-[10px] text-muted-foreground">Fichas ativas</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-lg text-amber-400 flex items-center justify-center gap-1">
              <Flame className="w-4 h-4" />0
            </p>
            <p className="text-[10px] text-muted-foreground">Sequência</p>
          </div>
        </div>
      </motion.div>

      {/* Physical data */}
      {(student.weight_kg || student.height_cm || student.bio) && (
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show" className="glass rounded-2xl p-5">
          <h3 className="font-display font-bold text-sm mb-4">Características físicas</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {student.weight_kg && (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-100">
                <Scale className="w-4 h-4 text-brand-400" />
                <div>
                  <p className="font-bold text-sm">{student.weight_kg} kg</p>
                  <p className="text-[10px] text-muted-foreground">Peso</p>
                </div>
              </div>
            )}
            {student.height_cm && (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-100">
                <Ruler className="w-4 h-4 text-cyan-400" />
                <div>
                  <p className="font-bold text-sm">{student.height_cm} cm</p>
                  <p className="text-[10px] text-muted-foreground">Altura</p>
                </div>
              </div>
            )}
            {student.bio && (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-100">
                <Dumbbell className="w-4 h-4 text-emerald-400" />
                <div>
                  <p className="font-bold text-sm">{student.bio}</p>
                  <p className="text-[10px] text-muted-foreground">Nível</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Bioimpedância — owner e personal podem editar. Read-only só pra outros roles (defensivo). */}
      {currentAcademy && (
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show">
          <BioimpedanceSection
            studentId={id}
            academyId={currentAcademy.id}
            studentHeight={student.height_cm ?? undefined}
            readOnly={!(isOwner || isPersonal)}
          />
        </motion.div>
      )}

      {/* Medidas Corporais */}
      {currentAcademy && (
        <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show">
          <MeasurementsSection
            studentId={id}
            academyId={currentAcademy.id}
            readOnly={!(isOwner || isPersonal)}
          />
        </motion.div>
      )}

      {/* Workout sheets */}
      <motion.div custom={5} variants={fadeUp} initial="hidden" animate="show" className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-sm">Fichas de treino ({sheets.length})</h3>
          {(isOwner || isPersonal) && (
            <Link
              href={`/treinos/novo?studentId=${id}`}
              className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Nova ficha
            </Link>
          )}
        </div>

        {sheets.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="w-10 h-10 rounded-xl bg-surface-200 flex items-center justify-center mb-3">
              <ClipboardList className="w-4.5 h-4.5 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">Nenhuma ficha atribuída</p>
            {(isOwner || isPersonal) && (
              <Link
                href={`/treinos/novo?studentId=${id}`}
                className="btn-primary text-xs py-2 px-4 rounded-xl mt-3 inline-flex items-center gap-1.5"
              >
                <Plus className="w-3 h-3" /> Criar ficha
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {sheets.map((s) => (
              <Link key={s.id} href={`/treinos/${s.id}`}>
                <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-200 transition-all group cursor-pointer">
                  <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                    <ClipboardList className="w-3.5 h-3.5 text-brand-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{s.name}</p>
                    {s.goal && <p className="text-xs text-muted-foreground">{s.goal}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {s.is_active && <span className="badge-success text-[9px]">Ativa</span>}
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
