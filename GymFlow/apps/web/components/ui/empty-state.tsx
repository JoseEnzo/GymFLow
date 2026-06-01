'use client'

import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateAction {
  label: string
  href?: string
  onClick?: () => void
  icon?: LucideIcon
}

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: EmptyStateAction
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  const ActionIcon = action?.icon

  const actionContent = action && (
    <>
      {ActionIcon && <ActionIcon className="w-3.5 h-3.5" />}
      {action.label}
    </>
  )

  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-20', className)}>
      <div className="w-14 h-14 rounded-2xl bg-surface-200 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-7 h-7 text-muted-foreground/40" />
      </div>
      <p className="font-semibold text-muted-foreground">{title}</p>
      {description && (
        <p className="text-sm text-muted-foreground/60 mt-1 max-w-xs">{description}</p>
      )}
      {action && (
        action.href ? (
          <Link
            href={action.href}
            className="mt-4 inline-flex items-center gap-1.5 btn-primary text-sm py-2 px-4 rounded-xl"
          >
            {actionContent}
          </Link>
        ) : (
          <button
            onClick={action.onClick}
            className="mt-4 inline-flex items-center gap-1.5 btn-primary text-sm py-2 px-4 rounded-xl"
          >
            {actionContent}
          </button>
        )
      )}
    </div>
  )
}
