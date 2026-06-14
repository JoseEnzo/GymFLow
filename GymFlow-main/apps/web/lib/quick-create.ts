import { ClipboardList, Salad, UtensilsCrossed, BookOpen, type LucideIcon } from 'lucide-react'

import type { MemberRole } from '@/types'

export interface QuickCreateAction {
  label: string
  sublabel: string
  href: string
  icon: LucideIcon
}

// Ações do botão "+ Novo" (header) e do command palette (busca).
// Só owner e personal criam conteúdo — aluno executa treino, não cria.
// Receita/exercício abrem o modal de criação na própria página via `?novo=1`.
export function getQuickCreateActions(role: MemberRole | null): QuickCreateAction[] {
  if (role !== 'owner' && role !== 'personal') return []
  return [
    { label: 'Nova ficha de treino', sublabel: 'Montar treino para um aluno', href: '/treinos/novo',     icon: ClipboardList },
    { label: 'Novo plano alimentar', sublabel: 'Dieta para um aluno',         href: '/dietas/novo',       icon: Salad },
    { label: 'Nova receita',         sublabel: 'Adicionar à biblioteca',      href: '/receitas?novo=1',   icon: UtensilsCrossed },
    { label: 'Novo exercício',       sublabel: 'Adicionar à biblioteca',      href: '/exercicios?novo=1', icon: BookOpen },
  ]
}
