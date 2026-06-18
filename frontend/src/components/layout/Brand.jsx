import { cn } from '@/lib/utils'

/** Wordmark: serif editorial, las tres F como acento. */
export function Brand({ className }) {
  return (
    <span className={cn('font-display text-xl tracking-tight text-foreground', className)}>
      <span className="text-primary">FFF</span>inanzas
    </span>
  )
}
