import { NextResponse } from 'next/server'
import { fetchCNPJ, validateCNPJ } from '@/lib/cnpj'

export async function GET(request: Request) {
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
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 422 }
    )
  }
}
