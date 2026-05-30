import { NextResponse } from 'next/server'

import { createAdminClient } from '@/lib/supabase/server'
import { validateCNPJ, validateCPF } from '@/lib/cnpj'

export async function POST(request: Request) {
  const { identifier, type } = await request.json() as { identifier: string; type: 'cnpj' | 'cpf' }

  if (!identifier || !type) {
    return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
  }

  const clean = identifier.replace(/\D/g, '')
  const admin = await createAdminClient()

  try {
    if (type === 'cnpj') {
      if (!validateCNPJ(clean)) {
        return NextResponse.json({ error: 'CNPJ inválido' }, { status: 400 })
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: academy, error } = await (admin as any)
        .from('academies')
        .select('owner_id')
        .eq('cnpj', clean)
        .single()

      if (error || !academy) {
        return NextResponse.json({ error: 'Nenhuma academia encontrada com este CNPJ' }, { status: 404 })
      }

      const { data: { user }, error: userError } = await admin.auth.admin.getUserById(academy.owner_id)
      if (userError || !user?.email) {
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
      }

      return NextResponse.json({ email: user.email })
    }

    if (type === 'cpf') {
      if (!validateCPF(clean)) {
        return NextResponse.json({ error: 'CPF inválido' }, { status: 400 })
      }

      // Lookup via profiles.cpf (migration 015+)
      const masked = clean.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')
      const { data: profile } = await admin
        .from('profiles')
        .select('id')
        .or(`cpf.eq.${clean},cpf.eq.${masked}`)
        .limit(1)
        .single()

      if (profile?.id) {
        const { data: { user }, error: userError } = await admin.auth.admin.getUserById(profile.id)
        if (!userError && user?.email) {
          return NextResponse.json({ email: user.email })
        }
      }

      return NextResponse.json({ error: 'Nenhum personal encontrado com este CPF' }, { status: 404 })
    }

    return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
