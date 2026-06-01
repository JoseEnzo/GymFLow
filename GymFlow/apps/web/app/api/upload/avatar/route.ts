/**
 * POST /api/upload/avatar
 * Valida e faz upload do avatar server-side.
 * Evita bypass da validação client-side via curl/Postman.
 */
import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { ALLOWED_IMAGE_TYPES, MAX_AVATAR_BYTES } from '@/lib/validations'
import { limiters } from '@/lib/rate-limit'

export async function POST(request: Request) {
  // 1. Auth
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  // 2. Rate limit por user
  const { success: rateLimitOk } = await limiters.api.limit(user.id)
  if (!rateLimitOk) {
    return NextResponse.json({ error: 'Muitas requisições. Tente novamente em breve.' }, { status: 429 })
  }

  // 3. Extrair form data
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Formato inválido — envie multipart/form-data' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'Campo "file" obrigatório' }, { status: 400 })
  }

  // 4. Validar tipo MIME (servidor — não confia no cliente)
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return NextResponse.json(
      { error: `Tipo não permitido. Use: ${ALLOWED_IMAGE_TYPES.join(', ')}` },
      { status: 415 }
    )
  }

  // 5. Validar tamanho (servidor)
  if (file.size > MAX_AVATAR_BYTES) {
    return NextResponse.json({ error: 'Arquivo muito grande. Máximo: 2 MB' }, { status: 413 })
  }

  // 6. Validar magic bytes (primeiros bytes devem bater com o tipo declarado)
  const bytes = new Uint8Array(await file.arrayBuffer())
  if (!isValidImageBytes(bytes, file.type)) {
    return NextResponse.json({ error: 'Arquivo corrompido ou tipo divergente' }, { status: 422 })
  }

  // 7. Upload no Storage (nome = user_id para prevenir sobrescrever arquivos de outros)
  const ext = file.type.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg'
  const path = `avatars/${user.id}.${ext}`

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: uploadError } = await (supabase as any).storage
    .from('avatars')
    .upload(path, bytes, { upsert: true, contentType: file.type })

  if (uploadError) {
    return NextResponse.json({ error: 'Erro ao salvar imagem' }, { status: 500 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: urlData } = (supabase as any).storage.from('avatars').getPublicUrl(path)
  const avatarUrl: string = urlData?.publicUrl ?? ''

  // 8. Atualizar profile
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile, error: updateError } = await (supabase as any)
    .from('profiles')
    .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq('id', user.id)
    .select()
    .single()

  if (updateError) {
    return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 })
  }

  return NextResponse.json({ avatarUrl: profile.avatar_url })
}

// ── Magic bytes check ─────────────────────────────────────────────────────────
function isValidImageBytes(bytes: Uint8Array, mimeType: string): boolean {
  if (bytes.length < 4) return false

  switch (mimeType) {
    case 'image/jpeg':
      // JPEG começa com FF D8 FF
      return bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF

    case 'image/png':
      // PNG: 89 50 4E 47 0D 0A 1A 0A
      return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47

    case 'image/webp':
      // WebP: "RIFF" no início + "WEBP" no offset 8
      return (
        bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
        bytes.length > 11 &&
        bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
      )

    case 'image/gif':
      // GIF87a ou GIF89a
      return bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46

    default:
      return false
  }
}
