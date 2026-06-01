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
        // Fallback: CNPJ pode estar só no user_metadata (cadastros antigos sem coluna preenchida)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: fallback, error: fallbackError } = await (admin as any)
          .schema('auth')
          .from('users')
          .select('email')
          .filter('raw_user_meta_data->>document', 'eq', clean)
          .filter('raw_user_meta_data->>account_type', 'eq', 'owner')
          .single()

        if (fallbackError || !fallback?.email) {
          return NextResponse.json({ error: 'Nenhuma academia encontrada com este CNPJ' }, { status: 404 })
        }

        return NextResponse.json({ email: fallback.email })
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (admin as any)
        .schema('auth')
        .from('users')
        .select('email')
        .filter('raw_user_meta_data->>document', 'eq', clean)
        .filter('raw_user_meta_data->>account_type', 'eq', 'personal')
        .single()

      if (!error && data?.email) {
        return NextResponse.json({ email: data.email })
      }

      // Fallback: registros antigos salvaram o CPF com máscara (ex: "123.456.789-09")
      const masked = clean.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: fallback } = await (admin as any)
        .schema('auth')
        .from('users')
        .select('email')
        .filter('raw_user_meta_data->>document', 'eq', masked)
        .filter('raw_user_meta_data->>account_type', 'eq', 'personal')
        .single()

      if (!fallback?.email) {
        return NextResponse.json({ error: 'Nenhum personal encontrado com este CPF' }, { status: 404 })
      }

      return NextResponse.json({ email: fallback.email })
    }

    return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
