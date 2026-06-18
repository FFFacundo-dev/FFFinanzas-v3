import { cn } from '@/lib/utils'

/**
 * Estado vacío redactado (copy rules de frontend-design): título corto + una
 * línea de contexto + acción opcional. Sin ilustraciones pesadas.
 */
export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed border-border px-6 py-16 text-center',
        className,
      )}
    >
      {Icon && (
        <Icon className="mb-4 h-7 w-7 text-muted-foreground" weight="regular" />
      )}
      <p className="font-display text-lg text-foreground">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
