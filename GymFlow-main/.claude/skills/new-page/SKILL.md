---
name: new-page
description: create a new dashboard page for GymFlow following the established pattern
---

Creates a page at `apps/web/app/(dashboard)/<rota>/page.tsx`.

## Pattern obrigatório

```tsx
'use client'
import { motion } from 'framer-motion'
// imports de lucide, lib/utils, stores, components

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const fadeUp  = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
}

export default function NomePagina() {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={fadeUp}>
        <h2 className="section-title">Título</h2>
        <p className="section-subtitle mt-1">Subtítulo</p>
      </motion.div>
      {/* conteúdo */}
    </motion.div>
  )
}
```

## Classes de design system

| Classe | Uso |
|---|---|
| `glass` | cards com backdrop-blur |
| `card-interactive` | card clicável com hover lift |
| `btn-primary` | botão principal (indigo) |
| `btn-secondary` | botão secundário |
| `field` | input/textarea |
| `badge-primary/success/warning/danger/cyan` | badges coloridas |
| `section-title` / `section-subtitle` | heading de página |
| `gradient-text` | texto indigo→cyan |
| `progress-bar` + `progress-fill` | barra de progresso |

## Paleta

- Primary: `#6366F1` (brand-500) · Secondary: `#06B6D4` · Success: `#10B981` · Warning: `#F59E0B`
- Surfaces: `bg-surface-50/100/200/300` · Cards: `glass` · Borders: `border-border/40..60`

## Role guard

```tsx
import { useAuthStore } from '@/stores/auth-store'
const { currentRole } = useAuthStore()
const isOwnerOrPersonal = currentRole === 'owner' || currentRole === 'personal'
```

## Dados mock → Supabase

Mock data com `const MOCK_*` enquanto integra. Trocar por:
```tsx
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()
const { data } = await supabase.from('tabela').select('*')
```

## Tabelas disponíveis

`academies` · `academy_members` · `profiles` · `invites` · `exercises` ·
`workout_sheets` · `sheet_exercises` · `workout_logs` · `set_logs`
