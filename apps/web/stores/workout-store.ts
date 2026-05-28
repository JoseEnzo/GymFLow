import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

import type { ActiveWorkout, SetEntry, ExerciseWithSets } from '@/types'

interface WorkoutState {
  activeWorkout: ActiveWorkout | null
  setEntries: Record<string, SetEntry[]> // key: sheetExerciseId
  elapsedSeconds: number
  restTimer: number | null
  isRestTimerRunning: boolean

  startWorkout: (workout: ActiveWorkout) => void
  completeSet: (sheetExerciseId: string, setIndex: number, entry: SetEntry) => void
  nextExercise: () => void
  previousExercise: () => void
  startRestTimer: (seconds: number) => void
  tickRestTimer: () => void
  stopRestTimer: () => void
  tickElapsed: () => void
  completeWorkout: () => void
  abandonWorkout: () => void
  getCurrentExercise: () => ExerciseWithSets | null
  getProgress: () => { completed: number; total: number; percentage: number }
}

export const useWorkoutStore = create<WorkoutState>()(
  devtools(
    (set, get) => ({
      activeWorkout: null,
      setEntries: {},
      elapsedSeconds: 0,
      restTimer: null,
      isRestTimerRunning: false,

      startWorkout: (workout) =>
        set({
          activeWorkout: workout,
          setEntries: {},
          elapsedSeconds: 0,
          restTimer: null,
          isRestTimerRunning: false,
        }),

      completeSet: (sheetExerciseId, setIndex, entry) =>
        set((state) => {
          const entries = [...(state.setEntries[sheetExerciseId] ?? [])]
          entries[setIndex] = { ...entry, isCompleted: true }
          return {
            setEntries: { ...state.setEntries, [sheetExerciseId]: entries },
          }
        }),

      nextExercise: () =>
        set((state) => {
          if (!state.activeWorkout) return {}
          const next = Math.min(
            state.activeWorkout.currentExerciseIndex + 1,
            state.activeWorkout.exercises.length - 1
          )
          return {
            activeWorkout: {
              ...state.activeWorkout,
              currentExerciseIndex: next,
              currentSetIndex: 0,
            },
          }
        }),

      previousExercise: () =>
        set((state) => {
          if (!state.activeWorkout) return {}
          const prev = Math.max(state.activeWorkout.currentExerciseIndex - 1, 0)
          return {
            activeWorkout: {
              ...state.activeWorkout,
              currentExerciseIndex: prev,
              currentSetIndex: 0,
            },
          }
        }),

      startRestTimer: (seconds) =>
        set({ restTimer: seconds, isRestTimerRunning: true }),

      tickRestTimer: () =>
        set((state) => {
          if (!state.isRestTimerRunning || state.restTimer === null) return {}
          const next = state.restTimer - 1
          return {
            restTimer: next <= 0 ? null : next,
            isRestTimerRunning: next > 0,
          }
        }),

      stopRestTimer: () => set({ restTimer: null, isRestTimerRunning: false }),

      tickElapsed: () =>
        set((state) => ({ elapsedSeconds: state.elapsedSeconds + 1 })),

      completeWorkout: () =>
        set((state) => {
          if (!state.activeWorkout) return {}
          return {
            activeWorkout: { ...state.activeWorkout, isCompleted: true },
          }
        }),

      abandonWorkout: () =>
        set({ activeWorkout: null, setEntries: {}, elapsedSeconds: 0 }),

      getCurrentExercise: () => {
        const { activeWorkout } = get()
        if (!activeWorkout) return null
        return activeWorkout.exercises[activeWorkout.currentExerciseIndex] ?? null
      },

      getProgress: () => {
        const { activeWorkout, setEntries } = get()
        if (!activeWorkout) return { completed: 0, total: 0, percentage: 0 }

        let completed = 0
        let total = 0

        for (const ex of activeWorkout.exercises) {
          total += ex.sets
          const entries = setEntries[ex.id] ?? []
          completed += entries.filter((e) => e.isCompleted).length
        }

        return {
          completed,
          total,
          percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
        }
      },
    }),
    { name: 'WorkoutStore' }
  )
)
