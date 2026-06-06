'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Loader2, X } from 'lucide-react'

interface LeaveAcademyModalProps {
  academyName: string
  onConfirm: () => Promise<void>
  onClose: () => void
}

export function LeaveAcademyModal({ academyName, onConfirm, onClose }: LeaveAcademyModalProps) {
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)

  // Exige digitar o nome da academia pra confirmar — evita clique acidental.
  const canConfirm = confirmText.trim().toLowerCase() === academyName.trim().toLowerCase()

  async function handleConfirm() {
    if (!canConfirm) return
    setLoading(true)
    try {
      await onConfirm()
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="glass rounded-2xl p-6 w-full max-w-md border border-red-500/20 shadow-2xl"
        >
          <div className="flex items-start justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h2 className="font-display font-bold text-base">Sair desta academia</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Esta ação não pode ser desfeita aqui.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3 text-sm">
            <p>
              Você está saindo de <strong className="text-foreground">{academyName}</strong>.
              Vai perder acesso aos treinos, fichas e histórico vinculados a esta academia.
            </p>
            <p className="text-xs text-muted-foreground">
              Seu perfil e os vínculos com outras academias continuam ativos. Pra reentrar depois,
              vai precisar de um novo link de convite.
            </p>

            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-medium text-muted-foreground">
                Digite <strong className="text-foreground">{academyName}</strong> para confirmar:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={academyName}
                autoFocus
                className="field"
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex gap-2 mt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 btn-secondary text-sm py-2.5 rounded-xl disabled:opacity-40"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!canConfirm || loading}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-sm font-semibold py-2.5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sair'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
