import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, CaretLeft, CaretRight, ArrowsClockwise } from '@phosphor-icons/react'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { toInputDate } from '@/lib/format'
import { useGetBudgetsQuery, useCreateBudgetMutation } from './budgetApi'
import { BudgetCard } from './components/BudgetCard'
import { BudgetDetailDialog } from './components/BudgetDetailDialog'

const monthLabelFmt = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' })

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
  const [createBudget] = useCreateBudgetMutation()
  const [detailId, setDetailId] = useState(null)
  const detailBudget = budgetList.find((b) => b.id === detailId) ?? null

  function shiftMonth(delta) {
    setMonth((m) => {
      const d = new Date(m)
      d.setMonth(d.getMonth() + delta)
      return d
    })
  }

  async function handleNewBudget() {
    // ponytail: prompt nativo por ahora; la Tarea 3 lo reemplaza por un modal.
    const name = window.prompt('Nombre del nuevo presupuesto')?.trim()
    if (!name) return
    try {
      const created = await createBudget({ name, period_month: periodMonth }).unwrap()
      setDetailId(created.id) // abrir su detalle recién creado
      toast.success('Presupuesto creado')
    } catch (err) {
      toast.error(err?.message ?? 'No se pudo crear')
    }
  }

  return (
    <>
      <PageHeader
        title="Presupuesto"
        description="Plan mensual de ingresos y gastos hipotéticos."
        actions={
          <Button variant="outline" onClick={() => budgets.refetch()} disabled={budgets.isFetching}>
            <ArrowsClockwise className={`h-4 w-4 ${budgets.isFetching ? 'animate-spin' : ''}`} />
            Actualizar
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

      {/* Cards de presupuestos del mes */}
      {budgets.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgetList.map((b) => (
            <BudgetCard key={b.id} budget={b} onOpen={() => setDetailId(b.id)} />
          ))}
          <button
            type="button"
            onClick={handleNewBudget}
            className="block w-full text-left"
            aria-label="Nuevo presupuesto"
          >
            <Card className="h-full border-dashed shadow-none transition hover:border-primary/60">
              <CardContent className="flex h-full min-h-36 flex-col items-center justify-center gap-2 py-4 text-muted-foreground">
                <Plus className="h-6 w-6" />
                <span className="text-sm">Nuevo presupuesto</span>
              </CardContent>
            </Card>
          </button>
        </div>
      )}

      <BudgetDetailDialog
        open={!!detailBudget}
        onOpenChange={(o) => !o && setDetailId(null)}
        budget={detailBudget}
      />
    </>
  )
}
