'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'

export function useAuth() {
  const router = useRouter()
  const { profile, currentAcademy, currentRole, setProfile, setAcademies, reset } = useAuthStore()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any

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

    if (profileResult.data) setProfile(profileResult.data)

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

  async function signIn(email: string, password: string, redirectTo?: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    await loadUserData()
    const { academies } = useAuthStore.getState()
    router.push(redirectTo ?? (academies.length > 0 ? '/dashboard' : '/onboarding'))
  }

  async function signUp(email: string, password: string, fullName: string, accountType: 'owner' | 'personal' | 'student' = 'owner', redirectTo?: string, document?: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, account_type: accountType, document: document ?? null } },
    })
    if (error) throw error
    toast.success('Conta criada com sucesso!')
    router.push(redirectTo ?? '/onboarding')
  }

  async function signOut() {
    await supabase.auth.signOut()
    reset()
    router.push('/login')
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) throw error
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
    resetPassword,
    refresh: loadUserData,
  }
}
