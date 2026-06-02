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
