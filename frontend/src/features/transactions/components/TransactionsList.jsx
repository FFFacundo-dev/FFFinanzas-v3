import { ArrowDown, ArrowUp, PencilSimple, Trash } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { MoneyAmount } from '@/components/common/MoneyAmount'
import { EmptyState } from '@/components/common/EmptyState'
import { formatDate, toInputDate } from '@/lib/format'

function dayLabel(dateStr) {
  const today = toInputDate(new Date())
  const y = new Date()
  y.setDate(y.getDate() - 1)
  const yesterday = toInputDate(y)
  const key = toInputDate(dateStr)
  if (key === today) return 'Hoy'
  if (key === yesterday) return 'Ayer'
  return formatDate(dateStr)
}

/** Agrupa movimientos consecutivos por día (vienen ordenados por fecha desc). */
function groupByDay(items) {
  const groups = []
  let current = null
  for (const t of items) {
    const key = toInputDate(t.date)
    if (!current || current.key !== key) {
      current = { key, label: dayLabel(t.date), items: [] }
      groups.push(current)
    }
    current.items.push(t)
  }
  return groups
}

function TransactionRow({ t, onEdit, onDelete }) {
  const income = t.movement_type === 'INCOME'
  return (
    <li className="flex items-center gap-3 py-3">
      <span
        className={
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-sm ' +
          (income ? 'bg-income text-income-foreground' : 'bg-expense text-expense-foreground')
        }
      >
        {income ? (
          <ArrowDown className="h-4 w-4" weight="bold" />
        ) : (
          <ArrowUp className="h-4 w-4" weight="bold" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-foreground">
          {t.description || (income ? 'Ingreso' : 'Gasto')}
        </p>
        {(t.category_name || t.account_name) && (
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            {t.category_name && <span className="truncate">{t.category_name}</span>}
            {t.account_name && (
              <Badge
                variant="secondary"
                className="rounded-sm px-1.5 py-0 text-[11px] font-normal"
              >
                {t.account_name}
              </Badge>
            )}
          </div>
        )}
      </div>

      <MoneyAmount
        value={t.amount}
        currency={t.currency_code}
        tone={income ? 'income' : 'expense'}
        signed
        size="sm"
      />

      <div className="flex shrink-0 items-center">
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          aria-label="Editar"
          onClick={() => onEdit(t)}
        >
          <PencilSimple className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          aria-label="Eliminar"
          onClick={() => onDelete(t)}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    </li>
  )
}

/** Lista de movimientos agrupada por día, con acciones de editar/borrar. */
export function TransactionsList({ items, isLoading, onEdit, onDelete }) {
  if (isLoading) {
    return (
      <div className="space-y-3 py-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    )
  }

  if (!items?.length) {
    return (
      <EmptyState
        icon={ArrowDown}
        title="Sin movimientos"
        description="Registrá un ingreso o un gasto para empezar."
      />
    )
  }

  const groups = groupByDay(items)

  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <section key={g.key}>
          <header className="mb-1 flex items-center gap-3">
            <span className="font-mono tabular text-xs uppercase tracking-wide text-muted-foreground">
              {g.label}
            </span>
            <div className="h-px flex-1 bg-border" />
          </header>
          <ul className="divide-y divide-border">
            {g.items.map((t) => (
              <TransactionRow key={t.id} t={t} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
