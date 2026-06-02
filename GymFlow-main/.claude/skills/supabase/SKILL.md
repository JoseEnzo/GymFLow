---
name: supabase
description: run Supabase locally, reset database, generate types, write queries for GymFlow
---

GymFlow usa Supabase local via CLI. Todas as migrações estão em `supabase/migrations/`.

## Iniciar Supabase local

```bash
cd /home/jose-correia/Documentos/GymFlow
supabase start          # inicia containers (porta 54321)
supabase status         # mostra URL e anon key
```

Copie as keys para `apps/web/.env.local`.

## Reset completo (aplica todas as migrações + seed)

```bash
supabase db reset
```

Ordem das migrações:
1. `001_initial_schema.sql` — tabelas, triggers, funções helper
2. `002_rls_policies.sql` — Row Level Security
3. `003_seed_exercises.sql` — 40 exercícios globais

## Gerar tipos TypeScript

```bash
supabase gen types typescript --local > packages/database/src/types.ts
```

Rodar após qualquer alteração de schema.

## Padrão de query no servidor (Server Component / API Route)

```ts
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()
const { data, error } = await supabase.from('workout_sheets').select('*, exercises(*)').eq('student_id', userId)
```

## Padrão de query no cliente ('use client')

```ts
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()
```

## RLS — funções helper disponíveis

```sql
get_user_academy_ids()           -- retorna academias do usuário logado
get_user_role_in_academy(id)     -- retorna role do usuário na academia
```

Usar em policies customizadas:
```sql
using (academy_id = any(get_user_academy_ids()))
```

## Adicionar nova migração

```bash
supabase migration new nome_da_migracao
# edita supabase/migrations/<timestamp>_nome_da_migracao.sql
supabase db reset  # aplica tudo
```

## Tabelas e relações chave

```
academies ──< academy_members >── auth.users
academies ──< invites
academies ──< workout_sheets ──< sheet_exercises >── exercises
auth.users ──< workout_logs ──< set_logs
```
