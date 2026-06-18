import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, CaretLeft, CaretRight, ChartPieSlice, Trash } from '@phosphor-icons/react'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { MoneyAmount } from '@/components/common/MoneyAmount'
import { toInputDate } from '@/lib/format'
import {
  useGetBudgetItemsQuery,
  useGetBudgetSummaryQuery,
  useDeleteBudgetItemMutation,
} from './budgetApi'
import { AddBudgetItemDialog } from './components/AddBudgetItemDialog'

const monthLabelFmt = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' })

export function BudgetView() {
  const [month, setMonth] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d
  })
  const periodMonth = `${toInputDate(month).slice(0, 7)}-01`

  const items = useGetBudgetItemsQuery(periodMonth)
  const summary = useGetBudgetSummaryQuery(periodMonth)
  const [deleteItem] = useDeleteBudgetItemMutation()
  const [addOpen, setAddOpen] = useState(false)

  function shiftMonth(delta) {
    setMonth((m) => {
      const d = new Date(m)
      d.setMonth(d.getMonth() + delta)
      return d
    })
  }

  async function handleDelete(item) {
    try {
      await deleteItem(item.id).unwrap()
      toast.success('Ítem eliminado')
    } catch (err) {
      toast.error(err?.message ?? 'No se pudo eliminar')
    }
  }

  const rows = items.data ?? []
  const summaryRows = summary.data ?? []

  return (
    <>
      <PageHeader
        title="Presupuesto"
        description="Plan mensual de ingresos y gastos hipotéticos."
        actions={
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Ítem
          </Button>
        }
      />

      {/* Navegación de mes */}
      <div className="mb-6 flex items-center justify-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => shiftMonth(-1)} aria-label="Mes anterior">
          <CaretLeft className="h-5 w-5" />
        </Button>
        <span className="min-w-44 text-center font-display text-lg capitalize text-foreground">
          {monthLabelFmt.format(month)}
        </span>
        <Button variant="ghost" size="icon" onClick={() => shiftMonth(1)} aria-label="Mes siguiente">
          <CaretRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Resumen por moneda */}
      {summary.isLoading ? (
        <Skeleton className="mb-6 h-28 w-full rounded-lg" />
      ) : summaryRows.length > 0 ? (
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          {summaryRows.map((s) => {
            const income = Number(s.hypothetical_income_total)
            const expense = Number(s.hypothetical_expense_total)
            const fixed = Number(s.fixed_debt_total)
            const net = income - expense - fixed
            return (
              <Card key={s.currency_code} className="shadow-subtle">
                <CardContent className="py-4">
                  <p className="font-display text-sm text-foreground">{s.currency_code}</p>
                  <dl className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Fijos</dt>
                      <dd><MoneyAmount value={fixed} currency={s.currency_code} size="sm" tone="expense" /></dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Gastos hipotéticos</dt>
                      <dd><MoneyAmount value={expense} currency={s.currency_code} size="sm" tone="expense" /></dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Ingresos hipotéticos</dt>
                      <dd><MoneyAmount value={income} currency={s.currency_code} size="sm" tone="income" /></dd>
                    </div>
                    <div className="flex justify-between border-t border-border pt-1">
                      <dt className="text-foreground">Balance proyectado</dt>
                      <dd>
                        <MoneyAmount
                          value={Math.abs(net)}
                          currency={s.currency_code}
                          size="sm"
                          tone={net < 0 ? 'expense' : 'income'}
                          signed
                        />
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : null}

      {/* Ítems */}
      <Card className="shadow-subtle">
        <CardContent className="pt-6">
          {items.isLoading ? (
            <div className="space-y-3 py-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : !rows.length ? (
            <EmptyState
              icon={ChartPieSlice}
              title="Mes sin presupuesto"
              description="Agregá ítems hipotéticos; los fijos activos aparecen solos."
            />
          ) : (
            <ul className="divide-y divide-border">
              {rows.map((item) => {
                const income = item.flow_type === 'INCOME'
                const isSystem = item.source_kind === 'SYSTEM'
                return (
                  <li key={item.id} className="flex items-center gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm text-foreground">{item.label}</span>
                        {isSystem && (
                          <Badge variant="secondary" className="rounded-sm px-1.5 py-0 text-[11px] font-normal">
                            Fijo
                          </Badge>
                        )}
                        {item.paid && (
                          <Badge className="rounded-sm bg-income px-1.5 py-0 text-[11px] font-normal text-income-foreground">
                            Pagado
                          </Badge>
                        )}
                      </div>
                    </div>

                    <MoneyAmount
                      value={item.amount}
                      currency={item.currency_code}
                      tone={income ? 'income' : 'expense'}
                      signed
                      size="sm"
                    />

                    <div className="w-8 shrink-0">
                      {item.deletable && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          aria-label="Eliminar"
                          onClick={() => handleDelete(item)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <AddBudgetItemDialog open={addOpen} onOpenChange={setAddOpen} periodMonth={periodMonth} />
    </>
  )
}
