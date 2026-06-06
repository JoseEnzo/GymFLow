export type { Database, Json, Tables, TablesInsert, TablesUpdate, Enums } from './types'

export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    maxStudents: 30,
    maxPersonals: 1,
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 99,
    maxStudents: 100,
    maxPersonals: 3,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 199,
    maxStudents: Infinity,
    maxPersonals: Infinity,
  },
} as const

export const MUSCLE_GROUPS = [
  'Peito',
  'Costas',
  'Ombros',
  'Bíceps',
  'Tríceps',
  'Antebraços',
  'Abdômen',
  'Oblíquos',
  'Glúteos',
  'Quadríceps',
  'Isquiotibiais',
  'Panturrilhas',
  'Trapézio',
  'Lombar',
  'Cardio',
] as const

export const EQUIPMENT = [
  'Barra',
  'Halteres',
  'Máquina',
  'Cabo',
  'Peso Corporal',
  'Kettlebell',
  'Elástico',
  'Smith',
  'Banco',
  'Paralela',
  'Barra Fixa',
] as const

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number]
export type Equipment = (typeof EQUIPMENT)[number]

// ── Nutrição ──────────────────────────────────────────────
// Ordem reflete a sequência das refeições ao longo do dia.
export const MEAL_TYPES = [
  'cafe_da_manha',
  'lanche_manha',
  'almoco',
  'lanche_tarde',
  'jantar',
  'ceia',
  'pre_treino',
  'pos_treino',
] as const

export type MealType = (typeof MEAL_TYPES)[number]

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  cafe_da_manha: 'Café da manhã',
  lanche_manha: 'Lanche da manhã',
  almoco: 'Almoço',
  lanche_tarde: 'Lanche da tarde',
  jantar: 'Jantar',
  ceia: 'Ceia',
  pre_treino: 'Pré-treino',
  pos_treino: 'Pós-treino',
}

export const MEAL_TYPE_EMOJI: Record<MealType, string> = {
  cafe_da_manha: '🍳',
  lanche_manha: '🍎',
  almoco: '🍽️',
  lanche_tarde: '🥪',
  jantar: '🌙',
  ceia: '🥛',
  pre_treino: '⚡',
  pos_treino: '💪',
}

export const DIET_GOALS = [
  'Emagrecimento',
  'Hipertrofia',
  'Manutenção',
  'Definição',
  'Performance',
] as const

export type DietGoal = (typeof DIET_GOALS)[number]
