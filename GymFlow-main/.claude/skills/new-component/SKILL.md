---
name: new-component
description: create a new React component for GymFlow following the established pattern
---

Componentes ficam em `apps/web/components/<categoria>/<nome>.tsx`.

## Categorias e onde criar

| Categoria | Pasta | Exemplos |
|---|---|---|
| Layout estrutural | `components/layout/` | sidebar, header, mobile-nav |
| UI genérico | `components/ui/` | animated-number, progress-ring, shimmer-button |
| Gráficos | `components/charts/` | evolution-chart, frequency-heatmap |
| Treino/domínio | `components/workout/` | exercise-card, set-tracker, workout-timer |
| Formulários | `components/forms/` | cnpj-lookup, exercise-form |

## Template mínimo

```tsx
'use client'  // só se tiver estado/eventos/animação

import { cn } from '@/lib/utils'

interface Props {
  className?: string
  // props tipadas aqui
}

export function NomeComponente({ className }: Props) {
  return (
    <div className={cn('glass rounded-2xl p-4', className)}>
      {/* conteúdo */}
    </div>
  )
}
```

## Regras de animação (Framer Motion)

```tsx
import { motion } from 'framer-motion'

// Entrada simples
<motion.div
  initial={{ opacity: 0, y: 12 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
>

// Lista com stagger
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const item    = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }
<motion.ul variants={stagger} initial="hidden" animate="show">
  <motion.li variants={item}>...</motion.li>
</motion.ul>
```

## Cores inline (quando Tailwind não cobre)

```tsx
// Cor dinâmica por prop
style={{ background: `${color}15`, border: `1px solid ${color}25`, color }}
// Gradiente de texto
className="gradient-text"  // indigo→cyan
className="gradient-text-warm"  // amber→rose→indigo
```

## Ícones

Sempre de `lucide-react`. Tamanhos padrão: `w-4 h-4` (inline), `w-5 h-5` (botão), `w-6 h-6` (destaque).

## Tipagem de dados

```tsx
import type { Tables } from '@gymflow/database'
type Sheet    = Tables<'workout_sheets'>
type Exercise = Tables<'exercises'>
// etc.
```

## Checklist antes de finalizar

- [ ] `'use client'` só se realmente necessário (estado, events, animação)
- [ ] Props tipadas com interface
- [ ] `cn()` para classes condicionais
- [ ] Sem comentários óbvios no código
- [ ] Hover/focus states acessíveis
