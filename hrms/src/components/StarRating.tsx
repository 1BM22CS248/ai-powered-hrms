import { Star } from 'lucide-react'
import { cn } from '../lib/utils'

interface StarRatingProps {
  value: number
  max?: number
  readOnly?: boolean
  onChange?: (value: number) => void
  size?: 'sm' | 'md' | 'lg'
}

export function StarRating({ value, max = 5, readOnly = false, onChange, size = 'md' }: StarRatingProps) {
  const sizeClass = { sm: 'h-3 w-3', md: 'h-4 w-4', lg: 'h-5 w-5' }[size]

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(star)}
          className={cn('transition-colors', readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110')}
        >
          <Star
            className={cn(
              sizeClass,
              star <= value
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-muted-foreground fill-none'
            )}
          />
        </button>
      ))}
    </div>
  )
}
