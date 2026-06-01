import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { requireAuth } from '@/lib/api-guard'
import { createClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit-log'

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined
  writeAuditLog(auth.id, 'account.export', { ip })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any

  const [
    { data: profile },
    { data: memberships },
    { data: workoutLogs },
    { data: bioAssessments },
    { data: bodyMeasurements },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', auth.id).single(),
    supabase.from('academy_members').select('role, joined_at, academy_id').eq('user_id', auth.id),
    supabase.from('workout_logs').select('*, set_logs(*)').eq('student_id', auth.id).order('created_at', { ascending: false }),
    supabase.from('bioimpedance_assessments').select('*').eq('student_id', auth.id).order('assessed_at', { ascending: false }),
    supabase.from('body_measurements').select('*').eq('student_id', auth.id).order('measured_at', { ascending: false }),
  ])

  const payload = {
    exportedAt: new Date().toISOString(),
    user: { id: auth.id, email: auth.email },
    profile: profile ?? null,
    memberships: memberships ?? [],
    workoutLogs: workoutLogs ?? [],
    bioimpedanceAssessments: bioAssessments ?? [],
    bodyMeasurements: bodyMeasurements ?? [],
  }

  const filename = `gymflow-dados-${new Date().toISOString().slice(0, 10)}.json`

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
