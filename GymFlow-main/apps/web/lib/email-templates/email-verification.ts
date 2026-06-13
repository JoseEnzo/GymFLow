// HTML inline simples — mesmo padrão de weekly-inactivity.ts (sem React Email).

interface Args {
  name: string
  code: string
  verifyUrl: string
  expiresMinutes: number
}

export function emailVerificationEmail({ name, code, verifyUrl, expiresMinutes }: Args): {
  subject: string
  html: string
  text: string
} {
  const subject = `Seu código de verificação: ${code}`
  const spaced = code.split('').join('&nbsp;&nbsp;')

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
          <p style="margin:0;font-size:13px;opacity:0.9;letter-spacing:0.04em;">MeuTrein</p>
          <h1 style="margin:6px 0 0;font-size:22px;font-weight:800;">Confirme seu e-mail</h1>
        </td></tr>
        <tr><td style="padding:24px 28px;color:#0f172a;">
          <p style="margin:0 0 12px;font-size:16px;">Oi ${escapeHtml(name)},</p>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#334155;">
            Use o código abaixo pra confirmar seu e-mail e liberar o acesso à sua conta.
          </p>
          <div style="margin:0 0 20px;padding:18px 12px;background:#f1f5f9;border-radius:12px;text-align:center;">
            <span style="font-size:30px;font-weight:800;letter-spacing:6px;color:#6366F1;font-family:monospace;">${spaced}</span>
          </div>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
            <tr><td style="background:#6366F1;border-radius:10px;">
              <a href="${escapeHtml(verifyUrl)}" style="display:inline-block;padding:12px 22px;color:white;text-decoration:none;font-weight:600;font-size:14px;">
                Abrir verificação
              </a>
            </td></tr>
          </table>
          <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">
            O código expira em ${expiresMinutes} minutos. Se não foi você que criou a conta, ignore este e-mail.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  const text = `Oi ${name},

Seu código de verificação do MeuTrein é: ${code}

Ele expira em ${expiresMinutes} minutos.
Confirme em: ${verifyUrl}

Se não foi você que criou a conta, ignore este e-mail.

— MeuTrein`

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
