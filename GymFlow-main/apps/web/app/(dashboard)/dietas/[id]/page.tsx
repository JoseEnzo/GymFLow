'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Target, Plus, Trash2, Loader2, Flame, Salad, User, Beef, Wheat, Droplet,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { MEAL_TYPES, MEAL_TYPE_LABELS, MEAL_TYPE_EMOJI } from '@gymflow/database'

import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { cn, DIET_GOAL_COLORS, MEAL_TYPE_COLORS } from '@/lib/utils'

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] } }),
}

type MealType = (typeof MEAL_TYPES)[number]

interface PlanItem {
  id: string
  meal_type: MealType
  order_index: number
  servings: number
  grams: number | null
  notes: string | null
  recipe: {
    id: string
    name: string
    calories: number
    protein_g: number
    carbs_g: number
    fat_g: number
    serving_grams: number | null
  } | null
  food: {
    id: string
    name: string
    kcal_per_100g: number
    protein_per_100g: number
    carbs_per_100g: number
    fat_per_100g: number
  } | null
}

interface ItemMacros { name: string; kcal: number; prot: number; carb: number; fat: number; qtyLabel: string | null }

function getItemMacros(it: PlanItem): ItemMacros {
  if (it.food) {
    const factor = (it.grams ?? 100) / 100
    return {
      name: it.food.name,
      kcal: it.food.kcal_per_100g * factor,
      prot: it.food.protein_per_100g * factor,
      carb: it.food.carbs_per_100g * factor,
      fat: it.food.fat_per_100g * factor,
      qtyLabel: `${it.grams ?? 100}g`,
    }
  }
  if (it.recipe) {
    const multiplier = it.grams != null && it.recipe.serving_grams && it.recipe.serving_grams > 0
      ? it.grams / it.recipe.serving_grams
      : it.servings
    return {
      name: it.recipe.name,
      kcal: it.recipe.calories * multiplier,
      prot: it.recipe.protein_g * multiplier,
      carb: it.recipe.carbs_g * multiplier,
      fat: it.recipe.fat_g * multiplier,
      qtyLabel: it.grams != null ? `${it.grams}g` : (it.servings !== 1 ? `×${it.servings}` : null),
    }
  }
  return { name: '—', kcal: 0, prot: 0, carb: 0, fat: 0, qtyLabel: null }
}

interface MealPlan {
  id: string
  name: string
  goal: string | null
  description: string | null
  daily_calories: number | null
  is_active: boolean
  student?: { full_name: string | null } | null
  items: PlanItem[]
}

function MacroBadge({ icon: Icon, value, color }: { icon: typeof Flame; value: number; color: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium" style={{ color }}>
      <Icon className="w-3 h-3" /> {Math.round(value)}{Icon === Flame ? '' : 'g'}
    </span>
  )
}

export default function PlanoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { currentRole } = useAuthStore()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any
  const canEdit = currentRole === 'personal'

  const [plan, setPlan] = useState<MealPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)

  async function load() {
    const { data, error } = await supabase
      .from('meal_plans')
      .select(`
        id, name, goal, description, daily_calories, is_active, student_id,
        meal_plan_items (
          id, meal_type, order_index, servings, grams, notes,
          recipe:recipes ( id, name, calories, protein_g, carbs_g, fat_g, serving_grams ),
          food:food_items ( id, name, kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g )
        )
      `)
      .eq('id', id)
      .single()

    if (error || !data) { setNotFound(true); setLoading(false); return }

    let studentName: string | null = null
    if (data.student_id) {
      const { data: prof } = await supabase.from('profiles').select('full_name').eq('id', data.student_id).single()
      studentName = prof?.full_name ?? null
    }

    setPlan({
      ...data,
      student: { full_name: studentName },
      items: (data.meal_plan_items ?? []) as PlanItem[],
    })
    setLoading(false)
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id])

  async function handleRemove(itemId: string) {
    setRemoving(itemId)
    const { error } = await supabase.from('meal_plan_items').delete().eq('id', itemId)
    if (error) { toast.error('Erro ao remover.'); setRemoving(null); return }
    setPlan((p) => p ? { ...p, items: p.items.filter((i) => i.id !== itemId) } : p)
    setRemoving(null)
    toast.success('Receita removida.')
  }

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-brand-400" /></div>

  if (notFound || !plan) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 rounded-2xl bg-surface-200 flex items-center justify-center mb-4"><Salad className="w-6 h-6 text-muted-foreground/40" /></div>
        <p className="font-semibold">Plano não encontrado</p>
        <Link href="/dietas" className="btn-secondary text-sm py-2 px-4 rounded-xl mt-4 inline-flex">Voltar para planos</Link>
      </div>
    )
  }

  const color = DIET_GOAL_COLORS[plan.goal ?? ''] ?? '#10B981'

  // Totais diários
  const totals = plan.items.reduce(
    (acc, it) => {
      const m = getItemMacros(it)
      return {
        kcal: acc.kcal + m.kcal,
        prot: acc.prot + m.prot,
        carb: acc.carb + m.carb,
        fat: acc.fat + m.fat,
      }
    },
    { kcal: 0, prot: 0, carb: 0, fat: 0 }
  )

  // Refeições a renderizar: personal vê todas (pode adicionar); demais só as preenchidas.
  const usedMeals = new Set(plan.items.map((i) => i.meal_type))
  const mealsToShow = canEdit ? MEAL_TYPES : MEAL_TYPES.filter((m) => usedMeals.has(m))

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show" className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-surface-200 transition-all text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="section-title">Plano alimentar</h2>
      </motion.div>

      {/* Info card */}
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" className="glass rounded-2xl overflow-hidden">
        <div className="h-1" style={{ background: `linear-gradient(90deg, ${color}, ${color}44)` }} />
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                {plan.goal && <span className="badge text-[10px]" style={{ background: `${color}15`, color, borderColor: `${color}30` }}>{plan.goal}</span>}
                {plan.is_active && <span className="badge-success text-[10px]">Ativo</span>}
              </div>
              <h3 className="font-display font-bold text-lg">{plan.name}</h3>
              {plan.student?.full_name && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5"><User className="w-3 h-3" /> {plan.student.full_name}</p>
              )}
              {plan.description && <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>}
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
              <Salad className="w-5 h-5" style={{ color }} />
            </div>
          </div>

          {/* Totais */}
          <div className="grid grid-cols-4 gap-2 mt-5 pt-4 border-t border-border/40">
            <div className="text-center">
              <p className="font-bold text-base" style={{ color: '#F97316' }}>{Math.round(totals.kcal)}</p>
              <p className="text-[10px] text-muted-foreground">kcal{plan.daily_calories ? ` / ${plan.daily_calories}` : ''}</p>
            </div>
            <div className="text-center"><p className="font-bold text-base" style={{ color: '#EC4899' }}>{Math.round(totals.prot)}g</p><p className="text-[10px] text-muted-foreground">Proteína</p></div>
            <div className="text-center"><p className="font-bold text-base" style={{ color: '#6366F1' }}>{Math.round(totals.carb)}g</p><p className="text-[10px] text-muted-foreground">Carbo</p></div>
            <div className="text-center"><p className="font-bold text-base" style={{ color: '#10B981' }}>{Math.round(totals.fat)}g</p><p className="text-[10px] text-muted-foreground">Gordura</p></div>
          </div>
        </div>
      </motion.div>

      {/* Refeições */}
      {mealsToShow.map((meal, idx) => {
        const items = plan.items.filter((i) => i.meal_type === meal).sort((a, b) => a.order_index - b.order_index)
        const mealColor = MEAL_TYPE_COLORS[meal] ?? '#6366F1'
        const mealKcal = items.reduce((s, it) => s + getItemMacros(it).kcal, 0)
        if (!canEdit && items.length === 0) return null
        return (
          <motion.div key={meal} custom={2 + idx * 0.3} variants={fadeUp} initial="hidden" animate="show" className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{MEAL_TYPE_EMOJI[meal]}</span>
                <h4 className="font-display font-bold text-sm">{MEAL_TYPE_LABELS[meal]}</h4>
                {items.length > 0 && <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Flame className="w-3 h-3" /> {Math.round(mealKcal)} kcal</span>}
              </div>
              {canEdit && (
                <Link href={`/receitas?addTo=${plan.id}&meal=${meal}`} className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Receita
                </Link>
              )}
            </div>

            {items.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">Nenhuma receita nesta refeição.</p>
            ) : (
              <div className="space-y-2">
                {items.map((it) => {
                  const m = getItemMacros(it)
                  const isIngredient = !!it.food
                  return (
                  <div key={it.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-100 group">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${mealColor}15` }}>
                      <Salad className="w-4 h-4" style={{ color: mealColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold truncate">{m.name}</p>
                        {isIngredient && <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-brand-500/15 text-brand-300 flex-shrink-0">INGREDIENTE</span>}
                      </div>
                      <div className="flex items-center gap-2.5 mt-0.5 flex-wrap">
                        <MacroBadge icon={Flame} value={m.kcal} color="#F97316" />
                        <MacroBadge icon={Beef} value={m.prot} color="#EC4899" />
                        <MacroBadge icon={Wheat} value={m.carb} color="#6366F1" />
                        <MacroBadge icon={Droplet} value={m.fat} color="#10B981" />
                        {m.qtyLabel && <span className="text-[11px] text-muted-foreground font-medium">{m.qtyLabel}</span>}
                      </div>
                      {it.notes && <p className="text-[11px] text-muted-foreground mt-0.5 italic">{it.notes}</p>}
                    </div>
                    {canEdit && (
                      <button onClick={() => handleRemove(it.id)} disabled={removing === it.id} aria-label="Remover receita" className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-all flex-shrink-0">
                        {removing === it.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                  )
                })}
              </div>
            )}
          </motion.div>
        )
      })}

      {plan.items.length === 0 && !canEdit && (
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show" className="text-center py-12">
          <div className="w-12 h-12 rounded-2xl bg-surface-200 flex items-center justify-center mx-auto mb-3"><Salad className="w-5 h-5 text-muted-foreground/40" /></div>
          <p className="text-sm text-muted-foreground">Este plano ainda não tem receitas.</p>
        </motion.div>
      )}
    </div>
  )
}
