import type { LucideIcon } from 'lucide-react'
import { Button } from '../ui/button'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  cta?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon: Icon, title, description, cta }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      {Icon && (
        <div className="rounded-full bg-muted p-4">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      <p className="text-base font-semibold text-foreground">{title}</p>
      {description && <p className="text-sm text-muted-foreground max-w-xs">{description}</p>}
      {cta && (
        <Button size="sm" className="mt-2" onClick={cta.onClick}>
          {cta.label}
        </Button>
      )}
    </div>
  )
}
