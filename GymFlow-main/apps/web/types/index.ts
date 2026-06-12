import type { Tables } from '@gymflow/database'

// ──────────────────────────────────────────────
// Domain types (enriched rows)
// ──────────────────────────────────────────────
export type Academy = Tables<'academies'>
export type AcademyMember = Tables<'academy_members'>
export type Profile = Tables<'profiles'>
export type Invite = Tables<'invites'>
export type Exercise = Tables<'exercises'>
export type WorkoutSheet = Tables<'workout_sheets'>
export type SheetExercise = Tables<'sheet_exercises'>
export type WorkoutLog = Tables<'workout_logs'>
export type SetLog = Tables<'set_logs'>

export type MemberRole = 'owner' | 'personal' | 'student'
export type AcademyPlan = 'free' | 'personal' | 'starter' | 'pro'

// ──────────────────────────────────────────────
// Enriched / composed types
// ──────────────────────────────────────────────
export interface StudentWithProfile {
  member: AcademyMember
  profile: Profile
  activeSheets: number
  lastWorkout: string | null
  totalWorkouts: number
}

export interface SheetWithExercises extends WorkoutSheet {
  exercises: (SheetExercise & { exercise: Exercise })[]
}

export interface WorkoutLogWithDetails extends WorkoutLog {
  sheet: WorkoutSheet
  sets: (SetLog & { exercise: Exercise })[]
}

export interface ExerciseWithSets extends SheetExercise {
  exercise: Exercise
  completedSets: SetLog[]
}

// ──────────────────────────────────────────────
// UI state types
// ──────────────────────────────────────────────
export interface ActiveWorkout {
  logId: string
  sheetId: string
  startedAt: Date
  exercises: ExerciseWithSets[]
  currentExerciseIndex: number
  currentSetIndex: number
  isCompleted: boolean
}

export interface SetEntry {
  setNumber: number
  reps: number
  weight: number | null
  isCompleted: boolean
  notes?: string
}

export interface WorkoutSummary {
  totalSets: number
  totalReps: number
  heaviestLift: { exerciseName: string; weight: number } | null
  durationSeconds: number
  rating: number | null
}

// ──────────────────────────────────────────────
// API types
// ──────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  hasMore: boolean
}

// ──────────────────────────────────────────────
// Form types
// ──────────────────────────────────────────────
export interface LoginFormData {
  email: string
  password: string
}

export interface RegisterFormData {
  fullName: string
  email: string
  password: string
  confirmPassword: string
}

export interface AcademyFormData {
  cnpj: string
  name: string
  slug: string
  email: string
  phone: string
  address_street: string
  address_number: string
  address_complement?: string
  address_neighborhood: string
  address_city: string
  address_state: string
  address_zip: string
}

export interface WorkoutSheetFormData {
  name: string
  goal: string
  description?: string
  studentId: string
  validUntil?: string
}

export interface SheetExerciseFormData {
  exerciseId: string
  sets: number
  reps: string
  restSeconds: number
  notes?: string
  weightSuggestion?: number
}

// ──────────────────────────────────────────────
// Chart / analytics types
// ──────────────────────────────────────────────
export interface EvolutionDataPoint {
  date: string
  weight: number
  reps: number
  volume: number
}

export interface FrequencyData {
  date: string
  count: number
  level: 0 | 1 | 2 | 3 | 4
}

export interface MuscleDistribution {
  muscle: string
  count: number
  percentage: number
  color: string
}

// ──────────────────────────────────────────────
// Navigation
// ──────────────────────────────────────────────
export interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
  roles?: MemberRole[]
}
