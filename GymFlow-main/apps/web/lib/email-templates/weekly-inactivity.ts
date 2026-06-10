// HTML inline simples — sem React Email pra não introduzir lib nova só pra
// 1 template. Quando o segundo template aparecer, considerar migrar.

interface InactiveStudent {
  name: string
  daysInactive: number
}

interface Args {
  ownerName: string
  academyName: string
  students: InactiveStudent[]
  dashboardUrl: string
}

export function weeklyInactivityEmail({ ownerName, academyName, students, dashboardUrl }: Args): {
  subject: string
  html: string
  text: string
} {
  const count = students.length
  const subject = count === 1
    ? `1 aluno sumiu essa semana — ${academyName}`
    : `${count} alunos sumiram essa semana — ${academyName}`

  const studentsList = students
    .map((s) => `<li style="padding:6px 0;border-bottom:1px solid #e5e7eb;">
      <strong>${escapeHtml(s.name)}</strong>
      <span style="color:#6b7280;font-size:13px;"> — sem treino há ${s.daysInactive} dias</span>
    </li>`)
    .join('')

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a14;padding:24px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;">
        <tr><td style="padding:24px 28px;background:linear-gradient(135deg,#6366F1,#06B6D4);color:white;">
          <p style="margin:0;font-size:13px;opacity:0.9;letter-spacing:0.04em;">MeuTrein • ${escapeHtml(academyName)}</p>
          <h1 style="margin:6px 0 0;font-size:22px;font-weight:800;">Resumo semanal</h1>
        </td></tr>
        <tr><td style="padding:24px 28px;color:#0f172a;">
          <p style="margin:0 0 12px;font-size:16px;">Oi ${escapeHtml(ownerName)},</p>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">
            Tem ${count === 1 ? 'um aluno' : `${count} alunos`} que ${count === 1 ? 'sumiu' : 'sumiram'} esta semana.
            Uma mensagem rápida no WhatsApp puxando a corda costuma resolver — pequeno gesto,
            grande impacto na permanência.
          </p>
          <ul style="margin:0 0 20px;padding:0;list-style:none;font-size:14px;color:#0f172a;">
            ${studentsList}
          </ul>
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr><td style="background:#6366F1;border-radius:10px;">
              <a href="${escapeHtml(dashboardUrl)}" style="display:inline-block;padding:12px 22px;color:white;text-decoration:none;font-weight:600;font-size:14px;">
                Ver no dashboard
              </a>
            </td></tr>
          </table>
          <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;line-height:1.6;">
            Você está recebendo isso porque ativou "Resumo semanal" em Configurações.
            <br/>Pra desativar, abra o app → Configurações → Notificações.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  const text = `Oi ${ownerName},

${count === 1 ? 'Um aluno sumiu' : `${count} alunos sumiram`} esta semana na ${academyName}:

${students.map((s) => `• ${s.name} — sem treino há ${s.daysInactive} dias`).join('\n')}

Uma mensagem rápida no WhatsApp puxando a corda costuma resolver.

Ver no dashboard: ${dashboardUrl}

— MeuTrein
Pra desativar esse email, abra Configurações → Notificações.
`

  return { subject, html, text }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
