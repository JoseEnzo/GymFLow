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
          set({ academies })
          // Auto-select first academy if none selected
          set((state) => {
            if (!state.currentAcademy && academies.length > 0) {
              return {
                currentAcademy: academies[0]!.academy,
                currentRole: academies[0]!.role,
              }
            }
            return {}
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
