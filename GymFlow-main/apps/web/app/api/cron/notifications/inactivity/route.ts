import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

import { resend, FROM_EMAIL, isResendConfigured } from '@/lib/resend'
import { weeklyInactivityEmail } from '@/lib/email-templates/weekly-inactivity'

// Service-role client — bypassa RLS. Usado só nessa rota (cron).
const admin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const KIND = 'weekly_inactivity'

interface InactiveStudentRow {
  user_id: string
  full_name: string | null
  last_workout_at: string | null
}

interface OwnerDashboard {
  inactive_students: InactiveStudentRow[]
}

// Vercel Cron envia esse header com o secret configurado em settings.
// Em dev local: passe `Authorization: Bearer $CRON_SECRET` manualmente.
function isAuthorized(request: Request): boolean {
  const auth = request.headers.get('authorization') ?? ''
  const secret = process.env['CRON_SECRET']
  if (!secret) return false
  return auth === `Bearer ${secret}`
}

// Segunda da semana corrente (00:00 UTC). Usado como `target_date` da idempotência.
function mondayOfThisWeek(): string {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  const day = d.getUTCDay() // 0 = dom
  const diff = day === 0 ? -6 : 1 - day
  d.setUTCDate(d.getUTCDate() + diff)
  return d.toISOString().slice(0, 10)
}

function daysSince(iso: string | null): number {
  if (!iso) return 999
  const ms = Date.now() - new Date(iso).getTime()
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)))
}

// Vercel Cron faz GET por padrão. Em dev local, `curl -X GET` com header.
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isResendConfigured()) {
    return NextResponse.json({ error: 'RESEND_API_KEY missing' }, { status: 503 })
  }

  const targetDate = mondayOfThisWeek()
  const now = new Date()
  const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7)
  const twoWeeksAgo = new Date(now); twoWeeksAgo.setDate(now.getDate() - 14)
  const monthAgo = new Date(now); monthAgo.setMonth(now.getMonth() - 1)

  // Lista de owners ativos com suas academias. RLS bypassada (service_role).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: ownerRows, error: ownersErr } = await (admin as any)
    .from('academy_members')
    .select('user_id, academy_id, academies!inner(name)')
    .eq('role', 'owner')
    .eq('is_active', true)

  if (ownersErr) {
    return NextResponse.json({ error: ownersErr.message }, { status: 500 })
  }

  const owners = (ownerRows ?? []) as Array<{
    user_id: string
    academy_id: string
    academies: { name: string } | null
  }>

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.meutrein.com.br'
  let sent = 0
  let skipped = 0
  let errors = 0

  for (const owner of owners) {
    try {
      // Check opt-in. Sem row na tabela = default true (definido na coluna).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: pref } = await (admin as any)
        .from('notification_preferences')
        .select('email_weekly_report')
        .eq('user_id', owner.user_id)
        .maybeSingle()
      const optedIn = pref ? !!pref.email_weekly_report : true
      if (!optedIn) { skipped++; continue }

      // Idempotência: insere antes do envio. Se já existe linha pra essa semana, skip.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: inserted, error: insErr } = await (admin as any)
        .from('sent_notifications')
        .insert({ user_id: owner.user_id, kind: KIND, target_date: targetDate })
        .select('id')
        .maybeSingle()
      if (insErr) {
        // 23505 = unique violation = já enviado essa semana
        if (insErr.code === '23505') { skipped++; continue }
        errors++
        console.error('inactivity cron: insert sent_notifications failed', insErr)
        continue
      }
      if (!inserted) { skipped++; continue }

      // RPC já existe (056). Service role bypassa o check de role (OWNER_ONLY) porque
      // get_user_role_in_academy resolve via auth.uid() — quando service role chama,
      // auth.uid() retorna null e a função explode com OWNER_ONLY.
      // Solução: query direta de inativos (mais simples que reescrever RPC).
      const inactive = await fetchInactiveStudents(owner.academy_id, weekAgo.toISOString())
      void twoWeeksAgo; void monthAgo
      if (inactive.length === 0) {
        // Sem inativos = nada pra enviar. Mantém o registro em sent_notifications
        // pra não tentar de novo essa semana.
        skipped++
        continue
      }

      // Nome do owner
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (admin as any)
        .from('profiles')
        .select('full_name')
        .eq('id', owner.user_id)
        .maybeSingle()
      const ownerName = (profile?.full_name as string | null)?.split(' ')[0] ?? 'tudo bem'

      // Email do owner
      const { data: userData } = await admin.auth.admin.getUserById(owner.user_id)
      const email = userData.user?.email
      if (!email) { errors++; continue }

      const academyName = owner.academies?.name ?? 'sua academia'
      const { subject, html, text } = weeklyInactivityEmail({
        ownerName,
        academyName,
        students: inactive.map((s) => ({
          name: s.full_name ?? 'Aluno',
          daysInactive: daysSince(s.last_workout_at),
        })),
        dashboardUrl: `${appUrl}/dashboard`,
      })

      const result = await resend!.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject,
        html,
        text,
      })

      if (result.error) {
        errors++
        console.error('inactivity cron: resend send failed', result.error)
      } else {
        sent++
      }
    } catch (err: unknown) {
      errors++
      console.error('inactivity cron: owner loop error', err)
    }
  }

  return NextResponse.json({ sent, skipped, errors, target_date: targetDate })
}

async function fetchInactiveStudents(academyId: string, weekAgoIso: string): Promise<InactiveStudentRow[]> {
  // Alunos ativos da academia que NÃO treinaram na última semana, com último treino.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: students } = await (admin as any)
    .from('academy_members')
    .select('user_id, profiles!inner(full_name)')
    .eq('academy_id', academyId)
    .eq('role', 'student')
    .eq('is_active', true)
    .limit(200)

  const list = (students ?? []) as Array<{ user_id: string; profiles: { full_name: string | null } | null }>
  if (list.length === 0) return []

  // Quem treinou na última semana?
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: recent } = await (admin as any)
    .from('workout_logs')
    .select('student_id')
    .eq('academy_id', academyId)
    .gte('created_at', weekAgoIso)
    .not('student_id', 'is', null)

  const activeSet = new Set<string>(
    ((recent ?? []) as Array<{ student_id: string }>).map((r) => r.student_id)
  )

  const inactiveIds = list.filter((s) => !activeSet.has(s.user_id)).map((s) => s.user_id)
  if (inactiveIds.length === 0) return []

  // Último treino de cada inativo (pra mostrar "há X dias")
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: lastLogs } = await (admin as any)
    .from('workout_logs')
    .select('student_id, created_at')
    .eq('academy_id', academyId)
    .in('student_id', inactiveIds)
    .order('created_at', { ascending: false })

  const lastMap = new Map<string, string>()
  for (const row of (lastLogs ?? []) as Array<{ student_id: string; created_at: string }>) {
    if (!lastMap.has(row.student_id)) lastMap.set(row.student_id, row.created_at)
  }

  return list
    .filter((s) => !activeSet.has(s.user_id))
    .slice(0, 12) // cap pra email não ficar gigante
    .map((s) => ({
      user_id: s.user_id,
      full_name: s.profiles?.full_name ?? null,
      last_workout_at: lastMap.get(s.user_id) ?? null,
    }))
}
