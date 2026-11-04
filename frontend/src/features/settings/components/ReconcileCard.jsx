import { useState } from 'react'
import { Scales } from '@phosphor-icons/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { MoneyAmount } from '@/components/common/MoneyAmount'
import { useGetCurrenciesQuery } from '@/features/currencies/currenciesApi'
import { useGetBalanceByCurrencyQuery } from '@/features/dashboard/dashboardApi'
import { ReconcileDialog } from './ReconcileDialog'

/** Conteo/reconciliación por moneda (PLAN D3). */
export function ReconcileCard() {
  const { data: currencies = [], isLoading: loadingCur } = useGetCurrenciesQuery()
  const { data: balances = [], isLoading: loadingBal } = useGetBalanceByCurrencyQuery()
  const byCode = new Map(
    balances.map((b) => [
      b.currency_code,
      { total: Number(b.total_balance), available: Number(b.available_balance) },
    ]),
  )

  const [reconcile, setReconcile] = useState(null)

  return (
    <Card className="shadow-subtle">
      <CardHeader>
        <CardTitle className="font-display text-base font-normal">Reconciliación</CardTitle>
        <p className="text-sm text-muted-foreground">
          Cuadrá el pozo con lo que realmente tenés; se registra un ajuste.
        </p>
      </CardHeader>
      <CardContent>
        {loadingCur || loadingBal ? (
          <Skeleton className="h-40 w-full rounded-lg" />
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {currencies.map((c) => {
              const { total, available } = byCode.get(c.code) ?? { total: 0, available: 0 }
              return (
                <li key={c.code} className="flex items-center gap-3 px-4 py-3">
                  <span className="w-16 shrink-0 text-sm text-foreground">{c.code}</span>
                  <div className="flex flex-1 flex-wrap items-baseline gap-x-4 gap-y-0.5">
                    <MoneyAmount value={total} currency={c.code} size="sm" />
                    <span className="text-xs text-muted-foreground">
                      Disponible{' '}
                      <MoneyAmount value={available} currency={c.code} size="sm" />
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReconcile({ currency: c.code, total, available })}
                  >
                    <Scales className="h-4 w-4" />
                    Conciliar
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>

      <ReconcileDialog
        open={Boolean(reconcile)}
        currency={reconcile?.currency}
        totalBalance={reconcile?.total ?? 0}
        availableBalance={reconcile?.available ?? 0}
        onOpenChange={(o) => !o && setReconcile(null)}
      />
    </Card>
  )
}
