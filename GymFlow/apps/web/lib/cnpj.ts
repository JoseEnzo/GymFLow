export interface CNPJData {
  cnpj: string
  razaoSocial: string
  nomeFantasia: string | null
  situacao: string
  email: string | null
  telefone: string | null
  endereco: {
    logradouro: string
    numero: string
    complemento: string | null
    bairro: string
    municipio: string
    uf: string
    cep: string
  }
}

export async function fetchCNPJ(cnpj: string): Promise<CNPJData> {
  const digits = cnpj.replace(/\D/g, '')
  if (digits.length !== 14) throw new Error('CNPJ inválido')

  const res = await fetch(`https://receitaws.com.br/v1/cnpj/${digits}`, {
    next: { revalidate: 86400 },
  })

  if (!res.ok) throw new Error('Falha ao consultar CNPJ')

  const data = await res.json()

  if (data.status === 'ERROR') throw new Error(data.message ?? 'CNPJ não encontrado')

  return {
    cnpj: digits,
    razaoSocial: data.nome ?? '',
    nomeFantasia: data.fantasia || null,
    situacao: data.situacao ?? '',
    email: data.email || null,
    telefone: data.telefone || null,
    endereco: {
      logradouro: data.logradouro ?? '',
      numero: data.numero ?? '',
      complemento: data.complemento || null,
      bairro: data.bairro ?? '',
      municipio: data.municipio ?? '',
      uf: data.uf ?? '',
      cep: (data.cep ?? '').replace(/\D/g, ''),
    },
  }
}

export function validateCNPJ(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, '')
  if (digits.length !== 14) return false
  if (/^(\d)\1+$/.test(digits)) return false

  let sum = 0
  let pos = digits.length - 2

  for (let i = digits.length - 2; i >= 0; i--) {
    sum += Number(digits[i]) * (pos >= 2 ? pos : pos + 8)
    pos--
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== Number(digits[12])) return false

  sum = 0
  pos = digits.length - 1

  for (let i = digits.length - 2; i >= 0; i--) {
    sum += Number(digits[i]) * (pos >= 2 ? pos : pos + 8)
    pos--
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  return result === Number(digits[13])
}
