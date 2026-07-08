import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash, PencilSimple, ChartPieSlice } from '@phosphor-icons/react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EmptyState } from '@/components/common/EmptyState'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { MoneyAmount } from '@/components/common/MoneyAmount'
import { convertViaArs } from '@/lib/fx'
import { useGetCurrenciesQuery } from '@/features/currencies/currenciesApi'
import { useGetExchangeRatesQuery } from '@/app/apiSlice'
import {
  useGetBudgetItemsQuery,
  useGetBudgetSummaryQuery,
  useDeleteBudgetItemMutation,
  useRenameBudgetMutation,
  useDeleteBudgetMutation,
} from '../budgetApi'
import { AddBudgetItemDialog } from './AddBudgetItemDialog'
import { BudgetNameDialog } from './BudgetNameDialog'

const ORIGINAL = '__original__' // ver cada moneda en la suya (sin conversión)

function BudgetDetail({ budget, onClose }) {
  const items = useGetBudgetItemsQuery(budget.id)
  const summary = useGetBudgetSummaryQuery(budget.id)
  const [deleteItem] = useDeleteBudgetItemMutation()
  const [renameBudget, { isLoading: renaming }] = useRenameBudgetMutation()
  const [deleteBudget] = useDeleteBudgetMutation()
  const [addOpen, setAddOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  // Conversión display-only: no toca ningún dato guardado.
  const [displayCurrency, setDisplayCurrency] = useState(ORIGINAL)
  const { data: currencies = [] } = useGetCurrenciesQuery()
  const { data: rates } = useGetExchangeRatesQuery(undefined, { skip: displayCurrency === ORIGINAL })
  const converting = displayCurrency !== ORIGINAL
  const show = (amount, from) =>
    converting ? convertViaArs(amount, from, displayCurrency, rates?.ars_per_currency) : Number(amount)
  const shownCurrency = (from) => (converting ? displayCurrency : from)

  async function handleDeleteItem(item) {
    try {
      await deleteItem(item.id).unwrap()
      toast.success('Ítem eliminado')
    } catch (err) {
      toast.error(err?.message ?? 'No se pudo eliminar')
    }
  }

  async function handleRename(name) {
    if (name === budget.name) {
      setRenameOpen(false)
      return
    }
    try {
      await renameBudget({ id: budget.id, name }).unwrap()
      setRenameOpen(false)
      toast.success('Presupuesto renombrado')
    } catch (err) {
      toast.error(err?.message ?? 'No se pudo renombrar')
    }
  }

  async function handleDeleteBudget() {
    try {
      await deleteBudget(budget.id).unwrap()
      toast.success('Presupuesto eliminado')
      onClose()
    } catch (err) {
      toast.error(err?.message ?? 'No se pudo eliminar')
    }
  }

  const rows = items.data ?? []
  const summaryRows = summary.data ?? []

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display">{budget.name}</DialogTitle>
        <DialogDescription>Ingresos y gastos hipotéticos de este presupuesto.</DialogDescription>
      </DialogHeader>

      {/* Acciones */}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          Ítem
        </Button>
        <Button size="sm" variant="outline" onClick={() => setRenameOpen(true)}>
          <PencilSimple className="h-4 w-4" />
          Renombrar
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-destructive hover:text-destructive"
          onClick={() => setConfirmOpen(true)}
        >
          <Trash className="h-4 w-4" />
          Eliminar
        </Button>
        <Select value={displayCurrency} onValueChange={setDisplayCurrency}>
          <SelectTrigger className="ml-auto h-8 w-40">
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
      </div>

      <ScrollArea className="max-h-[60vh]">
        <div className="pr-3">
          {/* Resumen por moneda */}
          {summary.isLoading ? (
            <Skeleton className="mb-4 h-28 w-full rounded-lg" />
          ) : summaryRows.length > 0 ? (
            <div className="mb-4 grid gap-3 sm:grid-cols-2">
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
                        <div className="flex justify-between gap-2">
                          <dt className="min-w-0 truncate text-muted-foreground">Fijos</dt>
                          <dd className="shrink-0"><MoneyAmount value={fixed} currency={cur} size="sm" tone="expense" /></dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt className="min-w-0 truncate text-muted-foreground">Gastos hipotéticos</dt>
                          <dd className="shrink-0"><MoneyAmount value={expense} currency={cur} size="sm" tone="expense" /></dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt className="min-w-0 truncate text-muted-foreground">Ingresos hipotéticos</dt>
                          <dd className="shrink-0"><MoneyAmount value={income} currency={cur} size="sm" tone="income" /></dd>
                        </div>
                        <div className="flex justify-between gap-2 border-t border-border pt-1">
                          <dt className="min-w-0 truncate text-foreground">Balance proyectado</dt>
                          <dd className="shrink-0">
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
          {items.isLoading ? (
            <div className="space-y-3 py-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : !rows.length ? (
            <EmptyState
              icon={ChartPieSlice}
              title="Presupuesto sin ítems"
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
                          onClick={() => handleDeleteItem(item)}
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
        </div>
      </ScrollArea>

      <AddBudgetItemDialog open={addOpen} onOpenChange={setAddOpen} budgetId={budget.id} />

      <BudgetNameDialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        title="Renombrar presupuesto"
        initialName={budget.name}
        submitLabel="Guardar"
        submitting={renaming}
        onSubmit={handleRename}
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`¿Eliminar "${budget.name}"?`}
        description="Se eliminará el presupuesto y todos sus ítems. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={handleDeleteBudget}
      />
    </>
  )
}

export function BudgetDetailDialog({ open, onOpenChange, budget }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        {open && budget && <BudgetDetail budget={budget} onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}
