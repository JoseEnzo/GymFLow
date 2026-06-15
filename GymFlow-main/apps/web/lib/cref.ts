import { validateCREF } from '@/lib/cnpj'

// ── Verificação REAL do CREF no conselho regional ────────────────────────────
// Não existe API pública oficial unificada de CREF. Os conselhos regionais que
// usam a plataforma Implanta (ServiçosOnline) expõem uma busca pública em JSON
// (`/publico/ConsultaInscritos/Buscar`) — o reCAPTCHA do site é só gate de UI,
// o endpoint responde server-side sem ele. Consultamos por número de registro e
// confirmamos número+categoria+UF + situação ATIVO.
//
// Cobertura atual (UFs cujos conselhos estão no Implanta): SP (CREF4),
// RJ/ES (CREF1), RS (CREF2). Demais conselhos têm infra própria heterogênea e o
// portal nacional do CONFEF é protegido por desafio anti-bot — UF fora do mapa
// retorna 'unsupported_uf' (não dá pra verificar automaticamente).
//
// Roda só no servidor (Node runtime): manipula Cookie/anti-forgery cross-site.

export type CrefStatus =
  | 'active'          // encontrado e ATIVO no conselho
  | 'inactive'        // encontrado mas situação não-ativa (baixado, cancelado…)
  | 'not_found'       // UF coberta, registro não existe
  | 'invalid_format'  // não bate o formato NNNNNN-C/UF
  | 'unsupported_uf'  // conselho da UF não é consultável online
  | 'unverifiable'    // UF coberta mas o portal falhou (timeout/erro)

export interface CrefVerification {
  status: CrefStatus
  nome?: string
  categoria?: string
  situacao?: string
  conselho?: string
  numeroRegistro?: string
}

interface CrefParts {
  numero: string
  categoria: string
  uf: string
}

export function parseCREF(value: string): CrefParts | null {
  const v = value.trim().toUpperCase()
  if (!validateCREF(v)) return null
  const m = v.match(/^(\d{4,6})-([A-Z])\/([A-Z]{2})$/)
  if (!m) return null
  return { numero: m[1]!, categoria: m[2]!, uf: m[3]! }
}

// UF → portal Implanta do conselho que a abrange.
const IMPLANTA_PORTALS: Record<string, { base: string; conselho: string }> = {
  SP: { base: 'https://cref-sp.implanta.net.br', conselho: 'CREF4/SP' },
  RJ: { base: 'https://cref-rj.implanta.net.br', conselho: 'CREF1/RJ-ES' },
  ES: { base: 'https://cref-rj.implanta.net.br', conselho: 'CREF1/RJ-ES' },
  RS: { base: 'https://cref-rs.implanta.net.br', conselho: 'CREF2/RS' },
}

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

interface CrefRecord {
  NumeroRegistro?: string
  Nome?: string
  Categoria?: string
  Situacao?: string
}

// ASP.NET anti-forgery é double-submit: token no campo hidden + cookie. Extrai o
// valor do hidden (a ordem de atributos varia entre name/value).
function extractToken(html: string): string | null {
  const a = html.match(/name="__RequestVerificationToken"[^>]*?value="([^"]+)"/i)
  if (a?.[1]) return a[1]
  const b = html.match(/value="([^"]+)"[^>]*?name="__RequestVerificationToken"/i)
  return b?.[1] ?? null
}

// Só o par name=value de cada Set-Cookie (descarta Path/HttpOnly/…).
function cookieHeader(setCookies: string[]): string {
  return setCookies.map((c) => c.split(';')[0]!.trim()).filter(Boolean).join('; ')
}

export async function verifyCREF(value: string): Promise<CrefVerification> {
  const parts = parseCREF(value)
  if (!parts) return { status: 'invalid_format' }

  const portal = IMPLANTA_PORTALS[parts.uf]
  if (!portal) return { status: 'unsupported_uf' }

  const consultaUrl = `${portal.base}/servicosOnline/Publico/ConsultaInscritos/`
  const buscarUrl = `${portal.base}/servicosOnline/publico/ConsultaInscritos/Buscar`

  try {
    // 1) GET da página → token anti-forgery + cookies de sessão.
    const pageRes = await fetch(consultaUrl, {
      headers: { 'User-Agent': UA, Accept: 'text/html' },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    })
    if (!pageRes.ok) return { status: 'unverifiable', conselho: portal.conselho }

    const html = await pageRes.text()
    const token = extractToken(html)
    const cookies = cookieHeader(pageRes.headers.getSetCookie())
    if (!token || !cookies) return { status: 'unverifiable', conselho: portal.conselho }

    // 2) POST da busca. O filtro casa por "contains", então mandamos o número
    // zero-paddado a 6 dígitos pra estreitar o resultado.
    const numeroQuery = `${parts.numero.padStart(6, '0')}-${parts.categoria}`
    const filtro = {
      NumeroRegistro: numeroQuery,
      NomeRazaoSocial: '',
      CPFCNPJ: '',
      IdCategoria: null,
      IdTipoInscricao: null,
      IdSituacao: null,
      IdSituacaoDetalhe: null,
      IdTituloAdicional: null,
      IdsEspecialidades: [],
      IdAreaAtuacaoProfissional: null,
      EnderecoUFEEmpresaFuncionamentoProfissionalComercial: '',
      EnderecoCidadeEmpresaFuncionamentoProfissionalComercial: '',
      Pagina: 1,
    }

    const res = await fetch(buscarUrl, {
      method: 'POST',
      headers: {
        'User-Agent': UA,
        'Content-Type': 'application/json; charset=utf-8',
        'X-Requested-With': 'XMLHttpRequest',
        __RequestVerificationToken: token,
        Cookie: cookies,
        Referer: consultaUrl,
      },
      body: JSON.stringify(filtro),
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return { status: 'unverifiable', conselho: portal.conselho }

    const json = (await res.json()) as { total?: number; data?: CrefRecord[] }
    const records = json.data ?? []

    // 3) Match exato: número (sem zeros à esquerda) + categoria + UF.
    const wantNum = parts.numero.replace(/^0+/, '') || '0'
    const match = records.find((r) => {
      const m = (r.NumeroRegistro ?? '').toUpperCase().match(/^(\d+)-([A-Z]+)\/([A-Z]{2})$/)
      if (!m) return false
      return (m[1]!.replace(/^0+/, '') || '0') === wantNum && m[2] === parts.categoria && m[3] === parts.uf
    })

    if (!match) return { status: 'not_found', conselho: portal.conselho }

    const active = (match.Situacao ?? '').trim().toUpperCase() === 'ATIVO'
    return {
      status: active ? 'active' : 'inactive',
      nome: match.Nome,
      categoria: match.Categoria,
      situacao: match.Situacao,
      conselho: portal.conselho,
      numeroRegistro: match.NumeroRegistro,
    }
  } catch {
    // Timeout, rede, mudança de HTML, etc. — não dá pra afirmar nada.
    return { status: 'unverifiable', conselho: portal.conselho }
  }
}
