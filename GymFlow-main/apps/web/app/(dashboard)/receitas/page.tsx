'use client'

import { useState, useEffect, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Search, Plus, X, Loader2, Check, ArrowLeft, UtensilsCrossed,
  Flame, Beef, Wheat, Droplet, Clock, Apple,
} from 'lucide-react'
import { toast } from 'sonner'
import { MEAL_TYPES, MEAL_TYPE_LABELS, MEAL_TYPE_EMOJI } from '@gymflow/database'

import { cn, MEAL_TYPE_COLORS } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } }
const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
}

const DIFFICULTY_LABELS = { beginner: 'Fácil', intermediate: 'Médio', advanced: 'Avançado' } as const
const DIFFICULTY_COLORS = { beginner: 'badge-success', intermediate: 'badge-warning', advanced: 'badge-danger' } as const

type Difficulty = 'beginner' | 'intermediate' | 'advanced'
type MealType = (typeof MEAL_TYPES)[number]

interface Recipe {
  id: string
  name: string
  description: string | null
  meal_types: MealType[]
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  prep_minutes: number
  servings: number
  serving_grams: number | null
  difficulty: Difficulty
  ingredients: string[]
  tags: string[]
  is_global: boolean
  created_by: string | null
  academy_id: string | null
}

const RECIPE_COLS = 'id, name, description, meal_types, calories, protein_g, carbs_g, fat_g, prep_minutes, servings, serving_grams, difficulty, ingredients, tags, is_global, created_by, academy_id'

interface FoodItem {
  id: string
  name: string
  kcal_per_100g: number
  protein_per_100g: number
  carbs_per_100g: number
  fat_per_100g: number
  category: string | null
  is_global: boolean
}

const FOOD_COLS = 'id, name, kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, category, is_global'

const CATEGORY_LABELS: Record<string, string> = {
  proteina: 'Proteína',
  laticinio: 'Laticínio',
  carboidrato: 'Carboidrato',
  fruta: 'Fruta',
  vegetal: 'Vegetal',
  gordura: 'Gordura',
  suplemento: 'Suplemento',
}

const CATEGORY_COLORS: Record<string, string> = {
  proteina: '#EC4899',
  laticinio: '#A78BFA',
  carboidrato: '#6366F1',
  fruta: '#F97316',
  vegetal: '#10B981',
  gordura: '#F59E0B',
  suplemento: '#14B8A6',
}

interface RecipeForm {
  name: string
  description: string
  difficulty: Difficulty
  meal_types: MealType[]
  calories: string
  protein_g: string
  carbs_g: string
  fat_g: string
  prep_minutes: string
  ingredients: string
  tags: string
}

function MacroPill({ icon: Icon, value, unit, color }: { icon: typeof Flame; value: number; unit: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium" style={{ color }}>
      <Icon className="w-3 h-3" /> {value}{unit}
    </span>
  )
}

function NewRecipeModal({ onClose, onCreated }: { onClose: () => void; onCreated: (r: Recipe) => void }) {
  const { currentAcademy } = useAuthStore()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any
  const [form, setForm] = useState<RecipeForm>({
    name: '', description: '', difficulty: 'beginner', meal_types: [],
    calories: '', protein_g: '', carbs_g: '', fat_g: '', prep_minutes: '', ingredients: '', tags: '',
  })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!form.name.trim()) { toast.error('Nome obrigatório.'); return }
    if (form.meal_types.length === 0) { toast.error('Selecione ao menos uma refeição.'); return }
    if (!currentAcademy) { toast.error('Nenhuma academia selecionada.'); return }

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('recipes')
        .insert({
          name: form.name.trim(),
          description: form.description.trim() || null,
          meal_types: form.meal_types,
          calories: parseInt(form.calories) || 0,
          protein_g: parseFloat(form.protein_g) || 0,
          carbs_g: parseFloat(form.carbs_g) || 0,
          fat_g: parseFloat(form.fat_g) || 0,
          prep_minutes: parseInt(form.prep_minutes) || 0,
          servings: 1,
          difficulty: form.difficulty,
          ingredients: form.ingredients ? form.ingredients.split(',').map((e) => e.trim()).filter(Boolean) : [],
          tags: form.tags ? form.tags.split(',').map((e) => e.trim()).filter(Boolean) : [],
          is_global: false,
          academy_id: currentAcademy.id,
          created_by: user?.id,
        })
        .select(RECIPE_COLS)
        .single()

      if (error) throw error
      toast.success('Receita criada!')
      onCreated(data as Recipe)
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Erro ao criar receita.')
    } finally {
      setSaving(false)
    }
  }

  function toggleMeal(m: MealType) {
    setForm((f) => ({
      ...f,
      meal_types: f.meal_types.includes(m) ? f.meal_types.filter((x) => x !== m) : [...f.meal_types, m],
    }))
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
        className="glass w-full max-w-md rounded-2xl p-6 space-y-4 border border-border/60 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold">Nova receita</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-200 transition-all text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Nome</label>
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex: Frango grelhado com arroz" className="field" />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Descrição <span className="text-xs text-muted-foreground">(opcional)</span></label>
          <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} placeholder="Breve descrição da receita" className="field text-sm resize-none" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Refeições</label>
          <div className="flex flex-wrap gap-2">
            {MEAL_TYPES.map((m) => {
              const active = form.meal_types.includes(m)
              const color = MEAL_TYPE_COLORS[m] ?? '#6366F1'
              return (
                <button key={m} type="button" onClick={() => toggleMeal(m)}
                  className={cn('px-3 py-1.5 rounded-full text-xs font-medium border transition-all', active ? 'text-white' : 'text-muted-foreground hover:text-foreground')}
                  style={active ? { background: color, borderColor: color } : { borderColor: 'hsl(var(--border) / 0.6)' }}>
                  {MEAL_TYPE_EMOJI[m]} {MEAL_TYPE_LABELS[m]}
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Calorias (kcal)</label>
            <input value={form.calories} onChange={(e) => setForm((f) => ({ ...f, calories: e.target.value }))} inputMode="numeric" placeholder="450" className="field text-sm" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Preparo (min)</label>
            <input value={form.prep_minutes} onChange={(e) => setForm((f) => ({ ...f, prep_minutes: e.target.value }))} inputMode="numeric" placeholder="20" className="field text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Proteína (g)</label>
            <input value={form.protein_g} onChange={(e) => setForm((f) => ({ ...f, protein_g: e.target.value }))} inputMode="decimal" placeholder="40" className="field text-sm" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Carbo (g)</label>
            <input value={form.carbs_g} onChange={(e) => setForm((f) => ({ ...f, carbs_g: e.target.value }))} inputMode="decimal" placeholder="45" className="field text-sm" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Gordura (g)</label>
            <input value={form.fat_g} onChange={(e) => setForm((f) => ({ ...f, fat_g: e.target.value }))} inputMode="decimal" placeholder="10" className="field text-sm" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Ingredientes <span className="text-xs text-muted-foreground">(separe por vírgula)</span></label>
          <input value={form.ingredients} onChange={(e) => setForm((f) => ({ ...f, ingredients: e.target.value }))} placeholder="150g frango, 100g arroz, Brócolis" className="field" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Dificuldade</label>
            <select value={form.difficulty} onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value as Difficulty }))} className="field text-sm">
              <option value="beginner">Fácil</option>
              <option value="intermediate">Médio</option>
              <option value="advanced">Avançado</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Tags <span className="text-xs text-muted-foreground">(vírgula)</span></label>
            <input value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} placeholder="low-carb, vegano" className="field text-sm" />
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 btn-secondary py-2.5 rounded-xl text-sm">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 btn-primary py-2.5 rounded-xl text-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar receita'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

interface AddConfig { servings: number; grams: number | null; notes: string }

function AddToPlanModal({ recipe, mealLabel, onClose, onConfirm, saving }: {
  recipe: Recipe
  mealLabel: string
  onClose: () => void
  onConfirm: (cfg: AddConfig) => void
  saving: boolean
}) {
  const canUseGrams = recipe.serving_grams != null && recipe.serving_grams > 0
  const [mode, setMode] = useState<'servings' | 'grams'>('servings')
  const [servings, setServings] = useState(1)
  const [grams, setGrams] = useState<number>(recipe.serving_grams ?? 100)

  const [notes, setNotes] = useState('')

  // Multiplicador efetivo pra preview de macros
  const multiplier = mode === 'grams' && canUseGrams
    ? grams / (recipe.serving_grams as number)
    : servings

  const previewKcal = Math.round(recipe.calories * multiplier)
  const previewProt = Math.round(recipe.protein_g * multiplier * 10) / 10

  function handleConfirm() {
    if (mode === 'grams' && canUseGrams) {
      onConfirm({ servings: 1, grams, notes })
    } else {
      onConfirm({ servings, grams: null, notes })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
        className="glass w-full max-w-sm rounded-2xl p-6 space-y-5 border border-border/60"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-sm">Adicionar à {mealLabel}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[220px]">{recipe.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-200 transition-all text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {canUseGrams && (
          <div className="inline-flex p-1 rounded-xl bg-surface-100 border border-border/60 w-full">
            <button
              type="button"
              onClick={() => setMode('servings')}
              className={cn('flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                mode === 'servings' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
            >
              Porções
            </button>
            <button
              type="button"
              onClick={() => setMode('grams')}
              className={cn('flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                mode === 'grams' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
            >
              Gramas
            </button>
          </div>
        )}

        {mode === 'servings' || !canUseGrams ? (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Porções</label>
            <div className="flex items-center gap-2">
              <button onClick={() => setServings((s) => Math.max(0.5, s - 0.5))} className="w-8 h-8 rounded-lg border border-border/60 flex items-center justify-center text-sm font-bold hover:bg-surface-100 transition-all">−</button>
              <span className="flex-1 text-center font-bold text-lg">{servings}</span>
              <button onClick={() => setServings((s) => Math.min(10, s + 0.5))} className="w-8 h-8 rounded-lg border border-border/60 flex items-center justify-center text-sm font-bold hover:bg-surface-100 transition-all">+</button>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Quantidade (g)</label>
            <div className="flex items-center gap-2">
              <button onClick={() => setGrams((g) => Math.max(10, g - 25))} className="w-8 h-8 rounded-lg border border-border/60 flex items-center justify-center text-sm font-bold hover:bg-surface-100 transition-all">−</button>
              <input
                type="number"
                inputMode="numeric"
                value={grams}
                onChange={(e) => setGrams(Math.max(1, parseInt(e.target.value) || 0))}
                className="flex-1 text-center font-bold text-lg bg-transparent border-0 focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button onClick={() => setGrams((g) => g + 25)} className="w-8 h-8 rounded-lg border border-border/60 flex items-center justify-center text-sm font-bold hover:bg-surface-100 transition-all">+</button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              1 porção ≈ {recipe.serving_grams}g
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="rounded-xl bg-surface-100 p-2">
            <p className="font-bold text-sm text-[#F97316]">{previewKcal}</p>
            <p className="text-[10px] text-muted-foreground">kcal</p>
          </div>
          <div className="rounded-xl bg-surface-100 p-2">
            <p className="font-bold text-sm text-[#EC4899]">{previewProt}g</p>
            <p className="text-[10px] text-muted-foreground">proteína</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Observação <span className="normal-case text-[10px]">(opcional)</span></label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex: substituir arroz por batata-doce..." rows={2} className="field text-sm resize-none" />
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 btn-secondary py-2.5 rounded-xl text-sm">Cancelar</button>
          <button onClick={handleConfirm} disabled={saving} className="flex-1 btn-primary py-2.5 rounded-xl text-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Adicionar'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

interface AddFoodConfig { grams: number; notes: string }

function AddFoodToPlanModal({ food, mealLabel, onClose, onConfirm, saving }: {
  food: FoodItem
  mealLabel: string
  onClose: () => void
  onConfirm: (cfg: AddFoodConfig) => void
  saving: boolean
}) {
  const [grams, setGrams] = useState(100)
  const [notes, setNotes] = useState('')

  const factor = grams / 100
  const previewKcal = Math.round(food.kcal_per_100g * factor)
  const previewProt = Math.round(food.protein_per_100g * factor * 10) / 10
  const previewCarb = Math.round(food.carbs_per_100g * factor * 10) / 10
  const previewFat = Math.round(food.fat_per_100g * factor * 10) / 10

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
        className="glass w-full max-w-sm rounded-2xl p-6 space-y-5 border border-border/60"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-sm">Adicionar à {mealLabel}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[220px]">{food.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-200 transition-all text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Quantidade (g)</label>
          <div className="flex items-center gap-2">
            <button onClick={() => setGrams((g) => Math.max(5, g - 25))} className="w-8 h-8 rounded-lg border border-border/60 flex items-center justify-center text-sm font-bold hover:bg-surface-100 transition-all">−</button>
            <input
              type="number"
              inputMode="numeric"
              value={grams}
              onChange={(e) => setGrams(Math.max(1, parseInt(e.target.value) || 0))}
              className="flex-1 text-center font-bold text-lg bg-transparent border-0 focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button onClick={() => setGrams((g) => g + 25)} className="w-8 h-8 rounded-lg border border-border/60 flex items-center justify-center text-sm font-bold hover:bg-surface-100 transition-all">+</button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="rounded-xl bg-surface-100 p-2">
            <p className="font-bold text-sm text-[#F97316]">{previewKcal}</p>
            <p className="text-[10px] text-muted-foreground">kcal</p>
          </div>
          <div className="rounded-xl bg-surface-100 p-2">
            <p className="font-bold text-sm text-[#EC4899]">{previewProt}g</p>
            <p className="text-[10px] text-muted-foreground">prot</p>
          </div>
          <div className="rounded-xl bg-surface-100 p-2">
            <p className="font-bold text-sm text-[#6366F1]">{previewCarb}g</p>
            <p className="text-[10px] text-muted-foreground">carb</p>
          </div>
          <div className="rounded-xl bg-surface-100 p-2">
            <p className="font-bold text-sm text-[#10B981]">{previewFat}g</p>
            <p className="text-[10px] text-muted-foreground">gord</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Observação <span className="normal-case text-[10px]">(opcional)</span></label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex: cozido sem sal, temperar com limão..." rows={2} className="field text-sm resize-none" />
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 btn-secondary py-2.5 rounded-xl text-sm">Cancelar</button>
          <button onClick={() => onConfirm({ grams, notes })} disabled={saving} className="flex-1 btn-primary py-2.5 rounded-xl text-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Adicionar'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function RecipeDetailModal({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
        className="glass w-full max-w-md rounded-2xl p-6 space-y-4 border border-border/60 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display font-bold">{recipe.name}</h3>
            {recipe.description && <p className="text-sm text-muted-foreground mt-1">{recipe.description}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-200 transition-all text-muted-foreground flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'kcal', value: recipe.calories, color: '#F97316' },
            { label: 'Prot', value: `${recipe.protein_g}g`, color: '#EC4899' },
            { label: 'Carb', value: `${recipe.carbs_g}g`, color: '#6366F1' },
            { label: 'Gord', value: `${recipe.fat_g}g`, color: '#10B981' },
          ].map((m) => (
            <div key={m.label} className="rounded-xl bg-surface-100 p-2.5 text-center">
              <p className="font-bold text-sm" style={{ color: m.color }}>{m.value}</p>
              <p className="text-[10px] text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {recipe.meal_types.map((m) => (
            <span key={m} className="px-2.5 py-1 rounded-full text-[10px] font-medium" style={{ background: `${MEAL_TYPE_COLORS[m] ?? '#6366F1'}15`, color: MEAL_TYPE_COLORS[m] ?? '#6366F1' }}>
              {MEAL_TYPE_EMOJI[m]} {MEAL_TYPE_LABELS[m]}
            </span>
          ))}
          {recipe.prep_minutes > 0 && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-surface-200 text-muted-foreground inline-flex items-center gap-1">
              <Clock className="w-3 h-3" /> {recipe.prep_minutes} min
            </span>
          )}
        </div>

        {recipe.ingredients.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2">Ingredientes</h4>
            <ul className="space-y-1">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-brand-400 flex-shrink-0" /> {ing}
                </li>
              ))}
            </ul>
          </div>
        )}

        {recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {recipe.tags.map((t) => (
              <span key={t} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface-200 text-muted-foreground">#{t}</span>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

function ReceitasContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const addTo = searchParams.get('addTo')
  const mealParam = searchParams.get('meal') as MealType | null
  const dayParam = searchParams.get('day')
  const dayIndex = dayParam !== null ? parseInt(dayParam, 10) : null
  const { currentAcademy, currentRole } = useAuthStore()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any
  // Owner tem as mesmas capacidades de personal (criar e atribuir receitas).
  const isPersonal = currentRole === 'personal' || currentRole === 'owner'

  const [activeTab, setActiveTab] = useState<'receitas' | 'ingredientes'>('receitas')
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [foods, setFoods] = useState<FoodItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedMeal, setSelectedMeal] = useState<MealType | null>(mealParam ?? null)
  const [showModal, setShowModal] = useState(false)
  const [adding, setAdding] = useState<string | null>(null)
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())
  const [addedFoodIds, setAddedFoodIds] = useState<Set<string>>(new Set())
  const [planName, setPlanName] = useState('')
  const [pending, setPending] = useState<Recipe | null>(null)
  const [pendingFood, setPendingFood] = useState<FoodItem | null>(null)
  const [detail, setDetail] = useState<Recipe | null>(null)

  useEffect(() => {
    async function load() {
      let rq = supabase.from('recipes').select(RECIPE_COLS).order('name')
      let fq = supabase.from('food_items').select(FOOD_COLS).order('name')
      if (currentAcademy) {
        rq = rq.or(`is_global.eq.true,academy_id.eq.${currentAcademy.id}`)
        fq = fq.or(`is_global.eq.true,academy_id.eq.${currentAcademy.id}`)
      } else {
        rq = rq.eq('is_global', true)
        fq = fq.eq('is_global', true)
      }

      const [rRes, fRes] = await Promise.all([rq, fq])
      if (rRes.error) toast.error('Erro ao carregar receitas.')
      else setRecipes((rRes.data ?? []) as Recipe[])
      if (fRes.error) toast.error('Erro ao carregar ingredientes.')
      else setFoods((fRes.data ?? []) as FoodItem[])
      setLoading(false)
    }
    load()

    if (addTo) {
      supabase.from('meal_plans').select('name').eq('id', addTo).single()
        .then(({ data }: { data: { name: string } | null }) => { if (data) setPlanName(data.name) })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAcademy, addTo])

  const mealLabel = mealParam ? MEAL_TYPE_LABELS[mealParam] : 'refeição'

  async function handleAddToPlan(recipe: Recipe, cfg: AddConfig) {
    if (!addTo || !mealParam || addedIds.has(recipe.id)) return
    setAdding(recipe.id)
    try {
      let countQuery = supabase
        .from('meal_plan_items')
        .select('id', { count: 'exact', head: true })
        .eq('plan_id', addTo)
        .eq('meal_type', mealParam)
      if (dayIndex !== null) countQuery = countQuery.eq('day_index', dayIndex)
      const { count } = await countQuery

      const { error } = await supabase.from('meal_plan_items').insert({
        plan_id: addTo,
        recipe_id: recipe.id,
        meal_type: mealParam,
        order_index: count ?? 0,
        servings: cfg.servings,
        grams: cfg.grams,
        notes: cfg.notes || null,
        ...(dayIndex !== null ? { day_index: dayIndex } : {}),
      })

      if (error) throw error
      setAddedIds((prev) => new Set([...prev, recipe.id]))
      setPending(null)
      toast.success('Receita adicionada ao plano!')
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Erro ao adicionar receita.')
    } finally {
      setAdding(null)
    }
  }

  async function handleAddFoodToPlan(food: FoodItem, cfg: AddFoodConfig) {
    if (!addTo || !mealParam || addedFoodIds.has(food.id)) return
    setAdding(food.id)
    try {
      let countQuery = supabase
        .from('meal_plan_items')
        .select('id', { count: 'exact', head: true })
        .eq('plan_id', addTo)
        .eq('meal_type', mealParam)
      if (dayIndex !== null) countQuery = countQuery.eq('day_index', dayIndex)
      const { count } = await countQuery

      const { error } = await supabase.from('meal_plan_items').insert({
        plan_id: addTo,
        food_item_id: food.id,
        recipe_id: null,
        meal_type: mealParam,
        order_index: count ?? 0,
        servings: 1,
        grams: cfg.grams,
        notes: cfg.notes || null,
        ...(dayIndex !== null ? { day_index: dayIndex } : {}),
      })

      if (error) throw error
      setAddedFoodIds((prev) => new Set([...prev, food.id]))
      setPendingFood(null)
      toast.success('Ingrediente adicionado ao plano!')
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Erro ao adicionar ingrediente.')
    } finally {
      setAdding(null)
    }
  }

  const filtered = recipes.filter((r) => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
    const matchMeal = !selectedMeal || r.meal_types.includes(selectedMeal)
    return matchSearch && matchMeal
  })

  const filteredFoods = foods.filter((f) => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase()) ||
      (f.category ?? '').toLowerCase().includes(search.toLowerCase())
    const matchCategory = !selectedCategory || f.category === selectedCategory
    return matchSearch && matchCategory
  })

  const categories = Array.from(new Set(foods.map((f) => f.category).filter(Boolean) as string[])).sort()

  const hasActiveFilter = activeTab === 'receitas'
    ? !!(search || selectedMeal)
    : !!(search || selectedCategory)

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      {/* addTo banner */}
      {addTo && (
        <motion.div variants={fadeUp} className="glass rounded-2xl p-4 border border-brand-500/20 bg-brand-500/5 flex items-center gap-3">
          <button onClick={() => router.push(`/dietas/${addTo}`)} className="p-1.5 rounded-lg hover:bg-brand-500/15 transition-all text-brand-400">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-brand-300">Adicionar à {mealLabel}</p>
            <p className="text-xs text-muted-foreground truncate">{planName || 'Carregando...'}</p>
          </div>
          {(addedIds.size + addedFoodIds.size) > 0 && <span className="badge-success text-[10px]">{addedIds.size + addedFoodIds.size} adicionado{(addedIds.size + addedFoodIds.size) > 1 ? 's' : ''}</span>}
          <button onClick={() => router.push(`/dietas/${addTo}`)} className="btn-primary text-xs py-2 px-4 rounded-xl">Concluir</button>
        </motion.div>
      )}

      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h2 className="section-title">{activeTab === 'receitas' ? 'Biblioteca de Receitas' : 'Ingredientes'}</h2>
          <p className="section-subtitle mt-1">
            {loading
              ? 'Carregando...'
              : activeTab === 'receitas'
                ? `${recipes.length} receitas disponíveis`
                : `${foods.length} ingredientes disponíveis`}
          </p>
        </div>
        {isPersonal && !addTo && activeTab === 'receitas' && (
          <button onClick={() => setShowModal(true)} className="btn-primary text-sm py-2.5 px-5 rounded-xl">
            <Plus className="w-4 h-4" /> Nova receita
          </button>
        )}
      </motion.div>

      {/* Tab switcher */}
      <motion.div variants={fadeUp}>
        <div className="inline-flex p-1 rounded-2xl bg-surface-100 border border-border/60">
          <button
            onClick={() => setActiveTab('receitas')}
            className={cn('px-5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2',
              activeTab === 'receitas'
                ? 'bg-card text-foreground shadow-md border border-border/60'
                : 'text-muted-foreground hover:text-foreground')}>
            <UtensilsCrossed className="w-4 h-4" /> Receitas
          </button>
          <button
            onClick={() => setActiveTab('ingredientes')}
            className={cn('px-5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2',
              activeTab === 'ingredientes'
                ? 'bg-card text-foreground shadow-md border border-border/60'
                : 'text-muted-foreground hover:text-foreground')}>
            <Apple className="w-4 h-4" /> Ingredientes
          </button>
        </div>
      </motion.div>

      {/* Filtros */}
      <motion.div variants={fadeUp} className="space-y-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={activeTab === 'receitas' ? 'Buscar receitas, tags...' : 'Buscar ingredientes, categoria...'}
            className="field pl-10" />
        </div>

        {activeTab === 'receitas' ? (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button onClick={() => setSelectedMeal(null)}
              className={cn('px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap flex-shrink-0',
                !selectedMeal ? 'bg-brand-500/15 text-brand-300 border-brand-500/30' : 'border-border/60 text-muted-foreground hover:border-border')}>
              Todas
            </button>
            {MEAL_TYPES.map((m) => {
              const color = MEAL_TYPE_COLORS[m] ?? '#6366F1'
              const active = selectedMeal === m
              return (
                <button key={m} onClick={() => setSelectedMeal(active ? null : m)}
                  className={cn('px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap flex-shrink-0', active ? 'text-white' : 'text-muted-foreground hover:text-foreground')}
                  style={active ? { background: color, borderColor: color } : { borderColor: 'hsl(var(--border) / 0.6)' }}>
                  {MEAL_TYPE_EMOJI[m]} {MEAL_TYPE_LABELS[m]}
                </button>
              )
            })}
          </div>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button onClick={() => setSelectedCategory(null)}
              className={cn('px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap flex-shrink-0',
                !selectedCategory ? 'bg-brand-500/15 text-brand-300 border-brand-500/30' : 'border-border/60 text-muted-foreground hover:border-border')}>
              Todas
            </button>
            {categories.map((c) => {
              const color = CATEGORY_COLORS[c] ?? '#6366F1'
              const active = selectedCategory === c
              return (
                <button key={c} onClick={() => setSelectedCategory(active ? null : c)}
                  className={cn('px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap flex-shrink-0', active ? 'text-white' : 'text-muted-foreground hover:text-foreground')}
                  style={active ? { background: color, borderColor: color } : { borderColor: 'hsl(var(--border) / 0.6)' }}>
                  {CATEGORY_LABELS[c] ?? c}
                </button>
              )
            })}
          </div>
        )}
      </motion.div>

      <motion.div variants={fadeUp} className="text-xs text-muted-foreground">
        {loading
          ? 'Carregando...'
          : activeTab === 'receitas'
            ? `${filtered.length} receita${filtered.length !== 1 ? 's' : ''} encontrada${filtered.length !== 1 ? 's' : ''}`
            : `${filteredFoods.length} ingrediente${filteredFoods.length !== 1 ? 's' : ''} encontrado${filteredFoods.length !== 1 ? 's' : ''}`}
      </motion.div>

      {loading && (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-brand-400" /></div>
      )}

      {!loading && activeTab === 'receitas' && (
        <motion.div variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((r) => {
            const primaryMeal = r.meal_types[0]
            const color = primaryMeal ? (MEAL_TYPE_COLORS[primaryMeal] ?? '#6366F1') : '#6366F1'
            const isAdded = addedIds.has(r.id)
            const isAddingThis = adding === r.id
            return (
              <motion.div key={r.id} variants={fadeUp}>
                <div
                  onClick={() => setDetail(r)}
                  className={cn('glass rounded-2xl p-4 group hover:border-brand-500/20 hover:-translate-y-0.5 transition-all duration-300 hover:shadow-card-hover cursor-pointer', isAdded && 'border-emerald-500/20 bg-emerald-500/3')}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                      style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                      <UtensilsCrossed style={{ color, width: '1.125rem', height: '1.125rem' }} />
                    </div>
                    <span className={cn(DIFFICULTY_COLORS[r.difficulty] ?? 'badge', 'text-[10px]')}>{DIFFICULTY_LABELS[r.difficulty] ?? r.difficulty}</span>
                  </div>
                  <h3 className="font-semibold text-sm leading-snug mb-2 line-clamp-2">{r.name}</h3>
                  <div className="flex items-center gap-2.5 flex-wrap mb-2">
                    <MacroPill icon={Flame} value={r.calories} unit=" kcal" color="#F97316" />
                    <MacroPill icon={Beef} value={r.protein_g} unit="g" color="#EC4899" />
                    <MacroPill icon={Wheat} value={r.carbs_g} unit="g" color="#6366F1" />
                    <MacroPill icon={Droplet} value={r.fat_g} unit="g" color="#10B981" />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {r.meal_types.slice(0, 3).map((m) => (
                      <span key={m} className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                        style={{ background: `${MEAL_TYPE_COLORS[m] ?? '#6366F1'}12`, color: MEAL_TYPE_COLORS[m] ?? '#6366F1' }}>
                        {MEAL_TYPE_EMOJI[m]}
                      </span>
                    ))}
                  </div>
                  {addTo && (
                    <button
                      onClick={(e) => { e.stopPropagation(); if (!isAdded) setPending(r) }}
                      disabled={isAdded || isAddingThis}
                      className={cn('w-full mt-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5',
                        isAdded ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 cursor-default' : 'bg-brand-500/15 text-brand-400 border border-brand-500/20 hover:bg-brand-500/25')}
                    >
                      {isAddingThis ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isAdded ? <><Check className="w-3.5 h-3.5" /> Adicionada</> : <><Plus className="w-3.5 h-3.5" /> Adicionar</>}
                    </button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {!loading && activeTab === 'ingredientes' && (
        <motion.div variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFoods.map((f) => {
            const color = f.category ? (CATEGORY_COLORS[f.category] ?? '#6366F1') : '#6366F1'
            const isAdded = addedFoodIds.has(f.id)
            const isAddingThis = adding === f.id
            return (
              <motion.div key={f.id} variants={fadeUp}>
                <div
                  onClick={() => { if (addTo && !isAdded) setPendingFood(f) }}
                  className={cn('glass rounded-2xl p-4 group hover:border-brand-500/20 hover:-translate-y-0.5 transition-all duration-300 hover:shadow-card-hover',
                    addTo ? 'cursor-pointer' : 'cursor-default',
                    isAdded && 'border-emerald-500/20 bg-emerald-500/3')}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                      style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                      <Apple style={{ color, width: '1.125rem', height: '1.125rem' }} />
                    </div>
                    {f.category && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                        style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
                        {CATEGORY_LABELS[f.category] ?? f.category}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm leading-snug mb-1 line-clamp-2">{f.name}</h3>
                  <p className="text-[10px] text-muted-foreground mb-2">por 100g</p>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <MacroPill icon={Flame} value={f.kcal_per_100g} unit=" kcal" color="#F97316" />
                    <MacroPill icon={Beef} value={f.protein_per_100g} unit="g" color="#EC4899" />
                    <MacroPill icon={Wheat} value={f.carbs_per_100g} unit="g" color="#6366F1" />
                    <MacroPill icon={Droplet} value={f.fat_per_100g} unit="g" color="#10B981" />
                  </div>
                  {addTo && (
                    <button
                      onClick={(e) => { e.stopPropagation(); if (!isAdded) setPendingFood(f) }}
                      disabled={isAdded || isAddingThis}
                      className={cn('w-full mt-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5',
                        isAdded ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 cursor-default' : 'bg-brand-500/15 text-brand-400 border border-brand-500/20 hover:bg-brand-500/25')}
                    >
                      {isAddingThis ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isAdded ? <><Check className="w-3.5 h-3.5" /> Adicionado</> : <><Plus className="w-3.5 h-3.5" /> Adicionar</>}
                    </button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {!loading && activeTab === 'receitas' && filtered.length === 0 && (
        <motion.div variants={fadeUp} className="text-center py-20">
          <div className="w-14 h-14 rounded-2xl bg-surface-200 flex items-center justify-center mx-auto mb-4">
            <UtensilsCrossed className="w-7 h-7 text-muted-foreground/40" />
          </div>
          <p className="font-semibold text-muted-foreground">Nenhuma receita encontrada</p>
          {hasActiveFilter && (
            <button onClick={() => { setSearch(''); setSelectedMeal(null) }} className="text-sm text-brand-400 mt-2 hover:underline">Limpar filtros</button>
          )}
        </motion.div>
      )}

      {!loading && activeTab === 'ingredientes' && filteredFoods.length === 0 && (
        <motion.div variants={fadeUp} className="text-center py-20">
          <div className="w-14 h-14 rounded-2xl bg-surface-200 flex items-center justify-center mx-auto mb-4">
            <Apple className="w-7 h-7 text-muted-foreground/40" />
          </div>
          <p className="font-semibold text-muted-foreground">Nenhum ingrediente encontrado</p>
          {hasActiveFilter && (
            <button onClick={() => { setSearch(''); setSelectedCategory(null) }} className="text-sm text-brand-400 mt-2 hover:underline">Limpar filtros</button>
          )}
        </motion.div>
      )}

      <AnimatePresence>
        {showModal && (
          <NewRecipeModal onClose={() => setShowModal(false)} onCreated={(r) => { setRecipes((prev) => [r, ...prev]); setShowModal(false) }} />
        )}
        {pending && (
          <AddToPlanModal recipe={pending} mealLabel={mealLabel} saving={adding === pending.id} onClose={() => setPending(null)} onConfirm={(cfg) => handleAddToPlan(pending, cfg)} />
        )}
        {pendingFood && (
          <AddFoodToPlanModal food={pendingFood} mealLabel={mealLabel} saving={adding === pendingFood.id} onClose={() => setPendingFood(null)} onConfirm={(cfg) => handleAddFoodToPlan(pendingFood, cfg)} />
        )}
        {detail && !addTo && <RecipeDetailModal recipe={detail} onClose={() => setDetail(null)} />}
      </AnimatePresence>
    </motion.div>
  )
}

export default function ReceitasPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-brand-400" /></div>}>
      <ReceitasContent />
    </Suspense>
  )
}
