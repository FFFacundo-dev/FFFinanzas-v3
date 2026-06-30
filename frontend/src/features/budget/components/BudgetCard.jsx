import { toast } from 'sonner'
import { Copy } from '@phosphor-icons/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MoneyAmount } from '@/components/common/MoneyAmount'
import { useGetBudgetSummaryQuery, useDuplicateBudgetMutation } from '../budgetApi'

const monthLabelFmt = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' })
const monthLabel = (periodMonth) => monthLabelFmt.format(new Date(`${String(periodMonth).slice(0, 10)}T00:00:00`))

// Card por presupuesto: nombre + mes + balance proyectado por moneda. Click → modal de detalle.
export function BudgetCard({ budget, onOpen }) {
  const { data: summaryRows = [], isLoading } = useGetBudgetSummaryQuery(budget.id)
  const [duplicate, { isLoading: duplicating }] = useDuplicateBudgetMutation()

  async function handleDuplicate() {
    try {
      await duplicate(budget.id).unwrap()
      toast.success('Presupuesto duplicado')
    } catch (err) {
      toast.error(err?.message ?? 'No se pudo duplicar')
    }
  }

  return (
    <div className="relative">
      <button type="button" onClick={() => onOpen(budget)} className="block w-full text-left">
        <Card className="h-full shadow-subtle transition hover:border-primary/60">
          <CardContent className="py-4">
            <p className="truncate pr-9 font-medium text-foreground">{budget.name}</p>
            <p className="text-xs capitalize text-muted-foreground">{monthLabel(budget.period_month)}</p>

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
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 h-8 w-8 text-muted-foreground"
        onClick={handleDuplicate}
        disabled={duplicating}
        aria-label="Duplicar presupuesto"
      >
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  )
}
