import { ArrowDown, ArrowUp } from '@phosphor-icons/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { MoneyAmount } from '@/components/common/MoneyAmount'
import { formatDate } from '@/lib/format'

/** Movimientos recientes (PLAN §5.3). */
export function RecentTransactionsCard({ data, isLoading }) {
  const rows = data?.items ?? []

  return (
    <Card className="shadow-subtle">
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-base font-normal">
          Movimientos recientes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3 py-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : !rows.length ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Todavía no registraste movimientos.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((t) => {
              const income = t.movement_type === 'INCOME'
              return (
                <li
                  key={t.id}
                  className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <span
                    className={
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-sm ' +
                      (income
                        ? 'bg-income text-income-foreground'
                        : 'bg-expense text-expense-foreground')
                    }
                  >
                    {income ? (
                      <ArrowDown className="h-3.5 w-3.5" weight="bold" />
                    ) : (
                      <ArrowUp className="h-3.5 w-3.5" weight="bold" />
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">
                      {t.description || (income ? 'Ingreso' : 'Gasto')}
                    </p>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="tabular font-mono">{formatDate(t.date)}</span>
                      {t.category_name && (
                        <>
                          <span>·</span>
                          <span className="truncate">{t.category_name}</span>
                        </>
                      )}
                      {t.account_name && (
                        <Badge
                          variant="secondary"
                          className="rounded-sm px-1.5 py-0 text-[11px] font-normal"
                        >
                          {t.account_name}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <MoneyAmount
                    value={t.amount}
                    currency={t.currency_code}
                    tone={income ? 'income' : 'expense'}
                    signed
                    size="sm"
                  />
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
