import { NextResponse } from 'next/server'

import { fetchCNPJ, validateCNPJ } from '@/lib/cnpj'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const cnpj = searchParams.get('cnpj')?.replace(/\D/g, '') ?? ''

  if (!cnpj || cnpj.length !== 14) {
    return NextResponse.json({ error: 'CNPJ inválido' }, { status: 400 })
  }

  if (!validateCNPJ(cnpj)) {
    return NextResponse.json({ error: 'CNPJ inválido' }, { status: 400 })
  }

  try {
    const data = await fetchCNPJ(cnpj)
    return NextResponse.json(data)
  } catch (err: unknown) {
    console.error('[cnpj]', err)
    return NextResponse.json(
      { error: 'CNPJ inválido ou não encontrado' },
      { status: 422 }
    )
  }
}
