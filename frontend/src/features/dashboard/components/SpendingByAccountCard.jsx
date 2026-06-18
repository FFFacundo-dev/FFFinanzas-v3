import { Bank, DeviceMobile, Money, Tag } from '@phosphor-icons/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { MoneyAmount } from '@/components/common/MoneyAmount'

const TYPE_ICON = {
  BANK: Bank,
  DIGITAL: DeviceMobile,
  CASH: Money,
}

/**
 * Gasto por cuenta/medio (PLAN §5.3, signature): las cuentas son etiquetas de
 * gasto, no tarjetas de saldo.
 */
export function SpendingByAccountCard({ data, isLoading }) {
  const rows = data ?? []

  return (
    <Card className="shadow-subtle">
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-base font-normal">
          Gasto por medio
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Las cuentas son etiquetas de gasto, no saldos.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-wrap gap-2 py-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-32 rounded-sm" />
            ))}
          </div>
        ) : !rows.length ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Todavía no hay gastos asociados a un medio.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {rows.map((r) => {
              const Icon = TYPE_ICON[r.account_type] ?? Tag
              return (
                <div
                  key={`${r.account_id}-${r.currency_code}`}
                  className="flex items-center gap-2.5 rounded-sm border border-border bg-secondary/40 py-1.5 pl-2.5 pr-3"
                >
                  <Badge
                    variant="secondary"
                    className="gap-1.5 rounded-sm font-normal"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {r.account_name}
                  </Badge>
                  <MoneyAmount
                    value={r.total_expense}
                    currency={r.currency_code}
                    tone="expense"
                    size="sm"
                  />
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
