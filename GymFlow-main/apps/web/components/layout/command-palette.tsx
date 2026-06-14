'use client'

import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, CornerDownLeft, Plus, ArrowRight } from 'lucide-react'

import { NAV_ITEMS } from '@/components/layout/sidebar'
import { useAuthStore } from '@/stores/auth-store'
import { getQuickCreateActions } from '@/lib/quick-create'
import { cn } from '@/lib/utils'

interface Command {
  label: string
  sublabel?: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  group: 'Criar' | 'Ir para'
}

function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const { currentRole, currentAcademy } = useAuthStore()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const isPersonalPlan = currentAcademy?.plan === 'personal'

  const commands = useMemo<Command[]>(() => {
    const creates: Command[] = getQuickCreateActions(currentRole).map((a) => ({
      label: a.label, sublabel: a.sublabel, href: a.href, icon: a.icon, group: 'Criar',
    }))

    const navs: Command[] = NAV_ITEMS
      .filter((item) => {
        if (item.roles && (!currentRole || !item.roles.includes(currentRole))) return false
        if (isPersonalPlan && (item.href === '/personais' || item.href === '/relatorios')) return false
        if (!isPersonalPlan && currentRole === 'owner' && item.href === '/frequencia') return false
        return true
      })
      .map((item) => ({ label: item.label, href: item.href, icon: item.icon, group: 'Ir para' as const }))

    return [...creates, ...navs]
  }, [currentRole, isPersonalPlan])

  const filtered = useMemo(() => {
    const q = normalize(query.trim())
    if (!q) return commands
    return commands.filter((c) => normalize(c.label).includes(q) || (c.sublabel && normalize(c.sublabel).includes(q)))
  }, [commands, query])

  // Reset ao abrir
  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  useEffect(() => { setActive(0) }, [query])

  function run(cmd: Command) {
    onClose()
    router.push(cmd.href)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const cmd = filtered[active]
      if (cmd) run(cmd)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          className="fixed inset-0 z-[60] flex items-start justify-center bg-black/60 backdrop-blur-sm px-4 pt-[12vh]"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border border-border/60 bg-card shadow-2xl overflow-hidden"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 border-b border-border/40">
              <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Buscar páginas ou criar algo novo..."
                className="flex-1 bg-transparent py-3.5 text-sm outline-none placeholder:text-muted-foreground"
              />
              <kbd className="text-[10px] font-mono bg-surface-200 px-1.5 py-0.5 rounded border border-border/60 text-muted-foreground">esc</kbd>
            </div>

            {/* Results */}
            <div className="max-h-[55vh] overflow-y-auto p-1.5">
              {filtered.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-muted-foreground">Nada encontrado para “{query}”.</p>
              ) : (
                filtered.map((cmd, i) => {
                  const prev = filtered[i - 1]
                  const showHeader = !prev || prev.group !== cmd.group
                  return (
                    <div key={cmd.href + cmd.label}>
                      {showHeader && (
                        <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                          {cmd.group}
                        </p>
                      )}
                      <button
                        onMouseEnter={() => setActive(i)}
                        onClick={() => run(cmd)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors',
                          i === active ? 'bg-surface-200' : 'hover:bg-surface-100'
                        )}
                      >
                        <span className={cn(
                          'flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0',
                          cmd.group === 'Criar' ? 'bg-brand-500/15 text-brand-300' : 'bg-surface-200 text-muted-foreground'
                        )}>
                          {cmd.group === 'Criar' ? <Plus className="w-4 h-4" /> : <cmd.icon className="w-4 h-4" />}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-medium truncate">{cmd.label}</span>
                          {cmd.sublabel && (
                            <span className="block text-xs text-muted-foreground truncate">{cmd.sublabel}</span>
                          )}
                        </span>
                        {i === active ? (
                          <CornerDownLeft className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />
                        )}
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
