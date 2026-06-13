import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InvitePayload {
  academy_id: string
  email: string
  role: 'personal' | 'student'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const authHeader = req.headers.get('Authorization')!
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))

    if (!user) throw new Error('Não autenticado')

    const { academy_id, email, role }: InvitePayload = await req.json()

    const { data: academy } = await supabase
      .from('academies')
      .select('name, slug')
      .eq('id', academy_id)
      .single()

    if (!academy) throw new Error('Academia não encontrada')

    const code = Math.random().toString(36).substring(2, 8).toUpperCase()

    const { data: invite, error } = await supabase
      .from('invites')
      .insert({ academy_id, created_by: user.id, code, role, email, uses_limit: 1 })
      .select('token')
      .single()

    if (error) throw error

    const inviteUrl = `${Deno.env.get('APP_URL')}/convite/${invite.token}`

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'GymFlow <noreply@gymflow.app>',
        to: email,
        subject: `Você foi convidado para ${academy.name} no MeuTrein`,
        html: buildInviteEmail({ academyName: academy.name, role, inviteUrl, code }),
      }),
    })

    if (!emailRes.ok) throw new Error('Falha ao enviar e-mail')

    return new Response(JSON.stringify({ success: true, code }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

function buildInviteEmail(params: {
  academyName: string
  role: string
  inviteUrl: string
  code: string
}) {
  const roleLabel = params.role === 'personal' ? 'Personal Trainer' : 'Aluno'
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"/></head>
    <body style="font-family: sans-serif; background: #06060F; color: #F1F5F9; padding: 40px 20px; margin:0;">
      <div style="max-width:560px; margin:0 auto; background:#0D0D1F; border-radius:16px; overflow:hidden; border:1px solid #1C1C35;">
        <div style="background:linear-gradient(135deg,#6366F1,#06B6D4); padding:32px; text-align:center;">
          <h1 style="margin:0; color:white; font-size:28px; font-weight:800;">MeuTrein</h1>
        </div>
        <div style="padding:32px;">
          <h2 style="color:#F1F5F9; font-size:22px;">Você foi convidado!</h2>
          <p style="color:#94A3B8; line-height:1.6;">
            Você recebeu um convite para ingressar na academia <strong style="color:#6366F1;">${params.academyName}</strong>
            como <strong>${roleLabel}</strong>.
          </p>
          <div style="background:#13132B; border-radius:12px; padding:20px; margin:24px 0; text-align:center;">
            <p style="margin:0 0 8px; color:#94A3B8; font-size:12px; text-transform:uppercase; letter-spacing:2px;">Código de convite</p>
            <p style="margin:0; color:#6366F1; font-size:32px; font-weight:800; letter-spacing:6px;">${params.code}</p>
          </div>
          <a href="${params.inviteUrl}" style="display:block; background:linear-gradient(135deg,#6366F1,#4F46E5); color:white; text-decoration:none; padding:16px 32px; border-radius:12px; text-align:center; font-weight:700; font-size:16px; margin:24px 0;">
            Aceitar convite
          </a>
          <p style="color:#475569; font-size:13px; text-align:center;">
            Ou acesse meutrein.com.br e use o código acima.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}
