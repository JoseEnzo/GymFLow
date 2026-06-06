import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function formatDate(date: string | Date, opts?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('pt-BR', opts).format(new Date(date))
}

export function formatRelativeDate(date: string | Date) {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const secs = Math.floor(diff / 1000)
  const mins = Math.floor(secs / 60)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)

  if (secs < 60) return 'agora'
  if (mins < 60) return `há ${mins}min`
  if (hours < 24) return `há ${hours}h`
  if (days < 7) return `há ${days}d`
  return formatDate(date, { day: '2-digit', month: 'short' })
}

export function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`
  if (m > 0) return `${m}m ${s.toString().padStart(2, '0')}s`
  return `${s}s`
}

export function formatCNPJ(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 14)
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

export function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 10) {
    return digits.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3')
  }
  return digits.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
}

export function formatCEP(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  return digits.replace(/^(\d{5})(\d{3})$/, '$1-$2')
}

export function slugify(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('')
}

export function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export function truncate(str: string, len: number) {
  if (str.length <= len) return str
  return str.slice(0, len - 3) + '...'
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const ROLE_LABELS: Record<string, string> = {
  owner: 'Proprietário',
  personal: 'Personal',
  student: 'Aluno',
}

export const MUSCLE_GROUP_COLORS: Record<string, string> = {
  Peito: '#6366F1',
  Costas: '#06B6D4',
  Ombros: '#8B5CF6',
  Bíceps: '#3B82F6',
  Tríceps: '#EC4899',
  Antebraços: '#14B8A6',
  Abdômen: '#F59E0B',
  Oblíquos: '#EF4444',
  Glúteos: '#10B981',
  Quadríceps: '#F97316',
  Isquiotibiais: '#84CC16',
  Panturrilhas: '#22C55E',
  Trapézio: '#A78BFA',
  Lombar: '#FB923C',
  Cardio: '#F43F5E',
}

// Cores por refeição do dia (nutrição)
export const MEAL_TYPE_COLORS: Record<string, string> = {
  cafe_da_manha: '#F59E0B',
  lanche_manha: '#10B981',
  almoco: '#6366F1',
  lanche_tarde: '#06B6D4',
  jantar: '#8B5CF6',
  ceia: '#A78BFA',
  pre_treino: '#F97316',
  pos_treino: '#EC4899',
}

// Cores por objetivo de dieta
export const DIET_GOAL_COLORS: Record<string, string> = {
  Emagrecimento: '#F97316',
  Hipertrofia: '#6366F1',
  Manutenção: '#10B981',
  Definição: '#EC4899',
  Performance: '#06B6D4',
}
