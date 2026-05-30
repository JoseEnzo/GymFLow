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

export function validateCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11) return false
  if (/^(\d)\1+$/.test(digits)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) sum += Number(digits[i]) * (10 - i)
  let rem = (sum * 10) % 11
  if (rem === 10 || rem === 11) rem = 0
  if (rem !== Number(digits[9])) return false

  sum = 0
  for (let i = 0; i < 10; i++) sum += Number(digits[i]) * (11 - i)
  rem = (sum * 10) % 11
  if (rem === 10 || rem === 11) rem = 0
  return rem === Number(digits[10])
}

export function maskCPF(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11)
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function maskCNPJ(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 14)
  return d
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

export function validateCNPJ(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, '')
  if (digits.length !== 14) return false
  if (/^(\d)\1+$/.test(digits)) return false

  const nums = digits.split('').map(Number)

  const checkDigit = (slice: number[]) => {
    const n = slice.length
    let sum = 0
    let weight = n - 7
    for (let i = 0; i < n; i++) {
      sum += slice[i] * weight--
      if (weight < 2) weight = 9
    }
    const rest = sum % 11
    return rest < 2 ? 0 : 11 - rest
  }

  return checkDigit(nums.slice(0, 12)) === nums[12]
      && checkDigit(nums.slice(0, 13)) === nums[13]
}
