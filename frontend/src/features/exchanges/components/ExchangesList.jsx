import { ArrowRight, Trash, ArrowsClockwise } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { MoneyAmount } from '@/components/common/MoneyAmount'
import { EmptyState } from '@/components/common/EmptyState'
import { formatDate, formatAmount } from '@/lib/format'

/** Lista de cambios de moneda con acción de borrar. */
export function ExchangesList({ items, isLoading, onDelete }) {
  if (isLoading) {
    return (
      <div className="space-y-3 py-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    )
  }

  if (!items?.length) {
    return (
      <EmptyState
        icon={ArrowsClockwise}
        title="Sin cambios de moneda"
        description="Registrá un cambio para mover valor entre pozos de distinta moneda."
      />
    )
  }

  return (
    <ul className="divide-y divide-border">
      {items.map((x) => (
        <li key={x.id} className="group flex items-center gap-3 py-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-secondary text-muted-foreground">
            <ArrowsClockwise className="h-4 w-4" />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <MoneyAmount value={x.from_amount} currency={x.from_currency_code} size="sm" />
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              <MoneyAmount value={x.to_amount} currency={x.to_currency_code} size="sm" />
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <span className="tabular font-mono">{formatDate(x.date)}</span>
              <span>·</span>
              <span className="tabular font-mono">
                1 {x.from_currency_code} = {formatAmount(x.exchange_rate)} {x.to_currency_code}
              </span>
              {x.description && (
                <>
                  <span>·</span>
                  <span className="truncate">{x.description}</span>
                </>
              )}
            </div>
          </div>

          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100 focus-within:opacity-100"
            aria-label="Eliminar"
            onClick={() => onDelete(x)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </li>
      ))}
    </ul>
  )
}
