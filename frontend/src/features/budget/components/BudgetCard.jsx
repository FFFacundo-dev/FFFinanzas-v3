import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MoneyAmount } from '@/components/common/MoneyAmount'
import { useGetBudgetSummaryQuery } from '../budgetApi'

// Card por presupuesto: nombre + balance proyectado por moneda. Click → modal de detalle.
export function BudgetCard({ budget, onOpen }) {
  const { data: summaryRows = [], isLoading } = useGetBudgetSummaryQuery(budget.id)

  return (
    <button type="button" onClick={() => onOpen(budget)} className="block w-full text-left">
      <Card className="h-full shadow-subtle transition hover:border-primary/60">
        <CardContent className="py-4">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate font-medium text-foreground">{budget.name}</p>
            {budget.is_default && (
              <Badge variant="secondary" className="shrink-0 rounded-sm font-normal">
                Por defecto
              </Badge>
            )}
          </div>

          <p className="mt-3 text-xs text-muted-foreground">Balance proyectado</p>
          <div className="mt-1 space-y-1">
            {isLoading ? (
              <span className="text-sm text-muted-foreground">Cargando…</span>
            ) : summaryRows.length ? (
              summaryRows.map((s) => {
                const net =
                  Number(s.hypothetical_income_total) -
                  Number(s.hypothetical_expense_total) -
                  Number(s.fixed_debt_total)
                return (
                  <div key={s.currency_code} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{s.currency_code}</span>
                    <MoneyAmount
                      value={Math.abs(net)}
                      currency={s.currency_code}
                      size="sm"
                      tone={net < 0 ? 'expense' : 'income'}
                      signed
                    />
                  </div>
                )
              })
            ) : (
              <span className="text-sm text-muted-foreground">Sin datos</span>
            )}
          </div>

          <p className="mt-3 text-xs text-primary">Ver detalle →</p>
        </CardContent>
      </Card>
    </button>
  )
}
