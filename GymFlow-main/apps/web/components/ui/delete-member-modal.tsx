'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Loader2, X } from 'lucide-react'

interface DeleteMemberModalProps {
  name: string | null
  role: 'student' | 'personal'
  onConfirm: (reason: string) => Promise<void>
  onClose: () => void
}

const LABEL = { student: 'aluno', personal: 'personal' }

export function DeleteMemberModal({ name, role, onConfirm, onClose }: DeleteMemberModalProps) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const label = LABEL[role]
  const displayName = name ?? (role === 'personal' ? 'Personal' : 'Aluno')

  async function handleConfirm() {
    if (reason.trim().length < 5) return
    setLoading(true)
    try {
      await onConfirm(reason.trim())
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
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="font-display font-bold text-base">Excluir {label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{displayName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-200 transition-all flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Warning */}
          <div className="rounded-xl bg-red-500/8 border border-red-500/15 p-3 mb-5">
            <p className="text-xs text-red-300 leading-relaxed">
              Esta ação é <strong>irreversível</strong>. O usuário e todos os seus dados
              (fichas, histórico de treinos) serão permanentemente excluídos.
            </p>
          </div>

          {/* Reason */}
          <div className="space-y-2 mb-5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Motivo da exclusão <span className="text-red-400">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={`Ex: ${role === 'student' ? 'Aluno cancelou o plano' : 'Personal encerrou contrato'}`}
              rows={3}
              className="field w-full resize-none text-sm"
              autoFocus
            />
            {reason.trim().length > 0 && reason.trim().length < 5 && (
              <p className="text-[11px] text-red-400">Mínimo de 5 caracteres</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="btn-secondary flex-1 py-2.5 rounded-xl text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading || reason.trim().length < 5}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                `Excluir ${label}`
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
