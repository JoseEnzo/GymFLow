'use client'

import { useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'

export function useAuth() {
  const router = useRouter()
  const { profile, currentAcademy, currentRole, setProfile, setAcademies, reset } = useAuthStore()
  // useMemo garante instância única do client. Sem isso, createClient() retorna um
  // objeto novo a cada render → loadUserData (useCallback) é recriado → o useEffect
  // abaixo roda a cada render → setAcademies atualiza o store → re-render → loop
  // infinito ("Maximum update depth exceeded") em TODAS as páginas do dashboard.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = useMemo(() => createClient(), []) as any

  const loadUserData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [profileResult, membersResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase
        .from('academy_members')
        .select('*, academy:academies(*)')
        .eq('user_id', user.id)
        .eq('is_active', true),
    ])

    if (profileResult.data) {
      setProfile(profileResult.data)
    } else {
      // O trigger handle_new_user não cria a linha de profile de forma confiável
      // no Supabase remoto, então alunos/personais ficam sem profile e o dono vê
      // "Aluno" no lugar do nome. Gravamos o profile no 1º login a partir do
      // metadata do auth para que o nome fique persistido e visível a todos.
      const metaName = user.user_metadata?.full_name ?? (user.email ? user.email.split('@')[0] : null)
      if (metaName) {
        const accountType = user.user_metadata?.account_type as string | undefined
        const doc = user.user_metadata?.document ?? null
        const upsertData = {
          id: user.id,
          full_name: metaName,
          email: user.email ?? null,
          avatar_url: null,
          cpf: accountType === 'student' ? doc : null,
          cref: accountType === 'personal' && typeof doc === 'string' ? doc.toUpperCase() : null,
        }
        // Persiste no banco (policy de insert permite id = auth.uid()). Se falhar
        // (ex: cref duplicado), ainda mostramos o nome em memória nesta sessão.
        const { data: created } = await supabase
          .from('profiles')
          .upsert(upsertData, { onConflict: 'id' })
          .select()
          .single()
        setProfile(created ?? {
          ...upsertData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          phone: null,
          birth_date: null,
          gender: null,
          height_cm: null,
          weight_kg: null,
          goal: null,
          bio: null,
        })
      }
    }

    if (membersResult.data) {
      const academies = (membersResult.data as Array<{ academy: unknown; role: string }>)
        .filter((m) => m.academy)
        .map((m) => ({ academy: m.academy as any, role: m.role as 'owner' | 'personal' | 'student' }))
      useAuthStore.getState().setAcademies(academies)
    }
  }, [supabase, setProfile, setAcademies])

  useEffect(() => {
    loadUserData()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string) => {
      if (event === 'SIGNED_IN') loadUserData()
      if (event === 'SIGNED_OUT') {
        reset()
        router.push('/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [loadUserData, reset, router, supabase.auth])

  async function signIn(email: string, password: string, redirectTo?: string, intendedRole?: 'owner' | 'personal' | 'student') {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    // Não chama reset() aqui: o SIGNED_IN event já dispara loadUserData() de forma
    // concorrente, e reset() causaria uma janela de estado inválido entre as duas
    // chamadas. loadUserData() sobrescreve todo o estado relevante diretamente.
    await loadUserData()
    if (intendedRole) {
      const { academies: loaded } = useAuthStore.getState()
      const match = loaded.find(a => a.role === intendedRole)
      if (match) useAuthStore.getState().setCurrentAcademy(match.academy, match.role)
    }
    const { academies } = useAuthStore.getState()
    router.push(redirectTo ?? (academies.length > 0 ? '/dashboard' : '/onboarding'))
  }

  async function signUp(email: string, password: string, fullName: string, accountType: 'owner' | 'personal' | 'student' = 'owner', redirectTo?: string, document?: string) {
    // Personal usa CREF (alfanumérico); demais usam documento numérico (CPF/CNPJ).
    // Documento vazio/só-espaços vira null — o trigger handle_new_user grava o
    // valor cru em profiles.cref/cpf (UNIQUE parcial), e '' não é NULL: dois
    // cadastros sem documento colidiriam no índice.
    const trimmedDoc = document?.trim() ?? ''
    const normalizedDoc = trimmedDoc
      ? (accountType === 'personal' ? trimmedDoc.toUpperCase() : trimmedDoc.replace(/\D/g, ''))
      : null
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, account_type: accountType, document: normalizedDoc } },
    })
    if (error) throw error
    // Com confirmação de e-mail ligada, o Supabase devolve "sucesso" com um user
    // SEM identities quando o e-mail já existe (proteção anti-enumeração). Sem
    // tratar isso, o usuário cairia no onboarding de uma conta que nunca loga.
    const identities = data?.user?.identities
    if (Array.isArray(identities) && identities.length === 0) {
      throw new Error('Este e-mail já está cadastrado. Faça login.')
    }
    toast.success('Conta criada com sucesso!')
    router.push(redirectTo ?? '/onboarding')
  }

  async function signOut() {
    await supabase.auth.signOut()
    reset()
    router.push('/login')
  }

  async function signInWithProvider(provider: 'google' | 'facebook' | 'github' | 'gitlab') {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) throw error
  }

  async function signInWithGoogle() {
    return signInWithProvider('google')
  }

  async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/redefinir-senha`,
    })
    if (error) throw error
    toast.success('E-mail de redefinição enviado!')
  }

  return {
    profile,
    currentAcademy,
    currentRole,
    isOwner: currentRole === 'owner',
    isPersonal: currentRole === 'personal',
    isStudent: currentRole === 'student',
    canManage: currentRole === 'owner' || currentRole === 'personal',
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    signInWithProvider,
    resetPassword,
    refresh: loadUserData,
  }
}
