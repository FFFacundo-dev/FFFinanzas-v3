import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, CaretLeft, CaretRight, ChartPieSlice, Trash, ArrowsClockwise } from '@phosphor-icons/react'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MoneyAmount } from '@/components/common/MoneyAmount'
import { toInputDate } from '@/lib/format'
import { convertViaArs } from '@/lib/fx'
import { useGetCurrenciesQuery } from '@/features/currencies/currenciesApi'
import { useGetExchangeRatesQuery } from '@/app/apiSlice'
import {
  useGetBudgetsQuery,
  useCreateBudgetMutation,
  useDeleteBudgetMutation,
  useGetBudgetItemsQuery,
  useGetBudgetSummaryQuery,
  useDeleteBudgetItemMutation,
} from './budgetApi'
import { AddBudgetItemDialog } from './components/AddBudgetItemDialog'

const monthLabelFmt = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' })
const ORIGINAL = '__original__' // ver cada moneda en la suya (sin conversión)

export function BudgetView() {
  const [month, setMonth] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d
  })
  const periodMonth = `${toInputDate(month).slice(0, 7)}-01`

  // Presupuestos del mes (varios, con nombre). El backend garantiza ≥1 (el default).
  const budgets = useGetBudgetsQuery(periodMonth)
  const budgetList = budgets.data ?? []
  const [pickedId, setPickedId] = useState(null)
  // Id efectivo derivado: la elección del usuario si sigue siendo válida, si no el default.
  const selectedId = budgetList.some((b) => b.id === pickedId) ? pickedId : (budgetList[0]?.id ?? null)
  const selectedBudget = budgetList.find((b) => b.id === selectedId) ?? null
  const [createBudget] = useCreateBudgetMutation()
  const [deleteBudget] = useDeleteBudgetMutation()

  const items = useGetBudgetItemsQuery(selectedId, { skip: !selectedId })
  const summary = useGetBudgetSummaryQuery(selectedId, { skip: !selectedId })
  const refreshing = budgets.isFetching || items.isFetching || summary.isFetching
  const [deleteItem] = useDeleteBudgetItemMutation()
  const [addOpen, setAddOpen] = useState(false)

  async function handleNewBudget() {
    // ponytail: prompt nativo para el nombre; un diálogo propio sería más código sin valor.
    const name = window.prompt('Nombre del nuevo presupuesto')?.trim()
    if (!name) return
    try {
      const created = await createBudget({ name, period_month: periodMonth }).unwrap()
      setPickedId(created.id)
      toast.success('Presupuesto creado')
    } catch (err) {
      toast.error(err?.message ?? 'No se pudo crear')
    }
  }

  async function handleDeleteBudget() {
    if (!selectedBudget || selectedBudget.is_default) return
    if (!window.confirm(`¿Eliminar "${selectedBudget.name}" y sus ítems?`)) return
    try {
      await deleteBudget(selectedBudget.id).unwrap()
      setPickedId(null) // vuelve a derivar el default
      toast.success('Presupuesto eliminado')
    } catch (err) {
      toast.error(err?.message ?? 'No se pudo eliminar')
    }
  }

  // Conversión display-only: no toca ningún dato guardado.
  const [displayCurrency, setDisplayCurrency] = useState(ORIGINAL)
  const { data: currencies = [] } = useGetCurrenciesQuery()
  const { data: rates } = useGetExchangeRatesQuery(undefined, { skip: displayCurrency === ORIGINAL })
  const converting = displayCurrency !== ORIGINAL
  // value en la moneda de display; from = moneda original del monto.
  const show = (amount, from) =>
    converting ? convertViaArs(amount, from, displayCurrency, rates?.ars_per_currency) : Number(amount)
  const shownCurrency = (from) => (converting ? displayCurrency : from)

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
          <>
            <Button
              variant="outline"
              onClick={() => {
                budgets.refetch()
                items.refetch()
                summary.refetch()
              }}
              disabled={refreshing}
            >
              <ArrowsClockwise className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button onClick={() => setAddOpen(true)} disabled={!selectedId}>
              <Plus className="h-4 w-4" />
              Ítem
            </Button>
          </>
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

      {/* Presupuestos del mes (varios, con nombre) */}
      <div className="mb-6 flex items-center justify-center gap-2 text-sm">
        <span className="text-muted-foreground">Presupuesto</span>
        <Select value={selectedId ?? ''} onValueChange={setPickedId} disabled={!budgetList.length}>
          <SelectTrigger className="h-8 w-48">
            <SelectValue placeholder="—" />
          </SelectTrigger>
          <SelectContent>
            {budgetList.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={handleNewBudget}>
          <Plus className="h-4 w-4" />
          Nuevo
        </Button>
        {selectedBudget && !selectedBudget.is_default && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            aria-label="Eliminar presupuesto"
            onClick={handleDeleteBudget}
          >
            <Trash className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Moneda de visualización (display-only, no altera datos guardados) */}
      <div className="mb-6 flex items-center justify-center gap-2 text-sm">
        <span className="text-muted-foreground">Ver en</span>
        <Select value={displayCurrency} onValueChange={setDisplayCurrency}>
          <SelectTrigger className="h-8 w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ORIGINAL}>Moneda original</SelectItem>
            {currencies.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {converting && (
          <span className="text-xs text-muted-foreground">· valores estimados</span>
        )}
      </div>

      {/* Resumen por moneda */}
      {summary.isLoading ? (
        <Skeleton className="mb-6 h-28 w-full rounded-lg" />
      ) : summaryRows.length > 0 ? (
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          {summaryRows.map((s) => {
            const cur = shownCurrency(s.currency_code)
            const income = show(s.hypothetical_income_total, s.currency_code)
            const expense = show(s.hypothetical_expense_total, s.currency_code)
            const fixed = show(s.fixed_debt_total, s.currency_code)
            const net = income - expense - fixed
            return (
              <Card key={s.currency_code} className="shadow-subtle">
                <CardContent className="py-4">
                  <p className="font-display text-sm text-foreground">{s.currency_code}</p>
                  <dl className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Fijos</dt>
                      <dd><MoneyAmount value={fixed} currency={cur} size="sm" tone="expense" /></dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Gastos hipotéticos</dt>
                      <dd><MoneyAmount value={expense} currency={cur} size="sm" tone="expense" /></dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Ingresos hipotéticos</dt>
                      <dd><MoneyAmount value={income} currency={cur} size="sm" tone="income" /></dd>
                    </div>
                    <div className="flex justify-between border-t border-border pt-1">
                      <dt className="text-foreground">Balance proyectado</dt>
                      <dd>
                        <MoneyAmount
                          value={Math.abs(net)}
                          currency={cur}
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
                      value={show(item.amount, item.currency_code)}
                      currency={shownCurrency(item.currency_code)}
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

      <AddBudgetItemDialog open={addOpen} onOpenChange={setAddOpen} budgetId={selectedId} />
    </>
  )
}
