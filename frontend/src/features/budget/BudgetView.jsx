import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, ArrowsClockwise } from '@phosphor-icons/react'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useGetBudgetsQuery, useCreateBudgetMutation } from './budgetApi'
import { BudgetCard } from './components/BudgetCard'
import { BudgetDetailDialog } from './components/BudgetDetailDialog'
import { BudgetNameDialog } from './components/BudgetNameDialog'

export function BudgetView() {
  // Todos los presupuestos del usuario (de cualquier mes).
  const budgets = useGetBudgetsQuery()
  const budgetList = budgets.data ?? []
  const [createBudget, { isLoading: creating }] = useCreateBudgetMutation()
  const [detailId, setDetailId] = useState(null)
  const [newOpen, setNewOpen] = useState(false)
  const [search, setSearch] = useState('')
  const detailBudget = budgetList.find((b) => b.id === detailId) ?? null

  const term = search.trim().toLowerCase()
  const visible = term ? budgetList.filter((b) => b.name.toLowerCase().includes(term)) : budgetList

  async function handleCreateBudget(name, period_month) {
    try {
      await createBudget({ name, period_month }).unwrap()
      setNewOpen(false)
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

      {/* Buscador por nombre */}
      <div className="mb-6">
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar presupuesto por nombre…"
          className="max-w-sm"
        />
      </div>

      {/* Cards de todos los presupuestos */}
      {budgets.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((b) => (
            <BudgetCard key={b.id} budget={b} onOpen={() => setDetailId(b.id)} />
          ))}
          <button
            type="button"
            onClick={() => setNewOpen(true)}
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

      <BudgetNameDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        title="Nuevo presupuesto"
        submitLabel="Crear"
        withMonth
        initialMonth={new Date().toISOString().slice(0, 7)}
        submitting={creating}
        onSubmit={handleCreateBudget}
      />
    </>
  )
}
