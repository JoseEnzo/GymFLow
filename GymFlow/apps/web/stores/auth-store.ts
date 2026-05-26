import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

import type { MemberRole, Profile, Academy } from '@/types'

interface AuthState {
  profile: Profile | null
  currentAcademy: Academy | null
  currentRole: MemberRole | null
  academies: Array<{ academy: Academy; role: MemberRole }>

  setProfile: (profile: Profile | null) => void
  setCurrentAcademy: (academy: Academy | null, role: MemberRole | null) => void
  setAcademies: (academies: Array<{ academy: Academy; role: MemberRole }>) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        profile: null,
        currentAcademy: null,
        currentRole: null,
        academies: [],

        setProfile: (profile) => set({ profile }),

        setCurrentAcademy: (academy, role) =>
          set({ currentAcademy: academy, currentRole: role }),

        setAcademies: (academies) => {
          set((state) => {
            // If current academy is in the list, always sync the role from DB
            if (state.currentAcademy) {
              const match = academies.find((a) => a.academy.id === state.currentAcademy!.id)
              if (match) {
                return { academies, currentAcademy: match.academy, currentRole: match.role }
              }
            }
            // No current selection or current academy not found — select first or clear
            const first = academies[0]
            return {
              academies,
              currentAcademy: first?.academy ?? null,
              currentRole: first?.role ?? null,
            }
          })
        },

        reset: () =>
          set({
            profile: null,
            currentAcademy: null,
            currentRole: null,
            academies: [],
          }),
      }),
      {
        name: 'gymflow-auth',
        partialize: (state) => ({
          currentAcademy: state.currentAcademy,
          currentRole: state.currentRole,
        }),
      }
    ),
    { name: 'AuthStore' }
  )
)

// Selectors
export const selectIsOwner = (s: AuthState) => s.currentRole === 'owner'
export const selectIsPersonal = (s: AuthState) => s.currentRole === 'personal'
export const selectIsStudent = (s: AuthState) => s.currentRole === 'student'
export const selectCanManage = (s: AuthState) =>
  s.currentRole === 'owner' || s.currentRole === 'personal'
