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
  const byCode = new Map(balances.map((b) => [b.currency_code, Number(b.total_balance)]))

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
              const balance = byCode.get(c.code) ?? 0
              return (
                <li key={c.code} className="flex items-center gap-3 px-4 py-3">
                  <span className="w-16 shrink-0 text-sm text-foreground">{c.code}</span>
                  <div className="flex-1">
                    <MoneyAmount value={balance} currency={c.code} size="sm" />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReconcile({ currency: c.code, balance })}
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
        currentBalance={reconcile?.balance ?? 0}
        onOpenChange={(o) => !o && setReconcile(null)}
      />
    </Card>
  )
}
