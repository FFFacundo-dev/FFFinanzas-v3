import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Target } from '@phosphor-icons/react'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { MoneyAmount } from '@/components/common/MoneyAmount'
import {
  useGetGoalsQuery,
  usePatchGoalStatusMutation,
  useDeleteGoalMutation,
  useCreateGoalMovementMutation,
} from './goalsApi'
import { GoalCard } from './components/GoalCard'
import { GoalDialog } from './components/GoalDialog'
import { GoalMovementDialog } from './components/GoalMovementDialog'
import { GoalDetailDialog } from './components/GoalDetailDialog'
import { GoalReconcileDialog } from './components/GoalReconcileDialog'
import { GoalActivityTable } from './components/GoalActivityTable'

function Section({ title, count, children }) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 font-display text-lg text-foreground">
        {title}
        <span className="rounded-sm bg-secondary px-1.5 py-0.5 text-xs font-sans text-muted-foreground">
          {count}
        </span>
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  )
}

export function GoalsView() {
  const { data: goals = [], isLoading } = useGetGoalsQuery()
  const [patchStatus] = usePatchGoalStatusMutation()
  const [deleteGoal] = useDeleteGoalMutation()
  const [createMovement] = useCreateGoalMovementMutation()

  const [dialog, setDialog] = useState({ open: false, goal: null })
  const [movement, setMovement] = useState({ open: false, goal: null, type: 'ALLOCATE' })
  const [detail, setDetail] = useState({ open: false, goal: null })
  const [reconcile, setReconcile] = useState({ open: false, goal: null })
  const [toDelete, setToDelete] = useState(null)
  const [toWithdrawAll, setToWithdrawAll] = useState(null)

  const childrenOf = (id) => goals.filter((g) => g.parent_id === id)
  // Las hijas no van a la grilla: solo se ven anidadas dentro de su meta padre.
  // Activas y completadas van juntas, ordenadas de + a - dinero reservado.
  // ponytail: compara montos crudos entre monedas; si hace falta normalizar por FX, ordenar en el back.
  const topLevel = goals
    .filter((g) => g.parent_id == null)
    .sort((a, b) => Number(b.current_amount) - Number(a.current_amount))
  const active = topLevel.filter((g) => g.status === 'ACTIVE')
  const archived = topLevel.filter((g) => g.status === 'ARCHIVED')

  // Total reservado (informativo), por moneda: los padres ya suman a sus hijas.
  const reservedByCurrency = Object.entries(
    active.reduce((acc, g) => {
      acc[g.currency_code] = (acc[g.currency_code] ?? 0) + Number(g.current_amount)
      return acc
    }, {}),
  ).filter(([, total]) => total > 0)

  async function confirmWithdrawAll() {
    try {
      await createMovement({
        id: toWithdrawAll.id,
        movement_type: 'RELEASE',
        amount: Number(toWithdrawAll.current_amount),
      }).unwrap()
      toast.success('Se retiró todo lo reservado de la meta')
    } catch (err) {
      toast.error(err?.message ?? 'No se pudo retirar')
    } finally {
      setToWithdrawAll(null)
    }
  }

  async function handleArchiveToggle(goal) {
    const next = goal.status === 'ARCHIVED' ? 'ACTIVE' : 'ARCHIVED'
    try {
      await patchStatus({ id: goal.id, status: next }).unwrap()
      toast.success(next === 'ARCHIVED' ? 'Meta archivada' : 'Meta restaurada')
    } catch (err) {
      toast.error(err?.message ?? 'No se pudo cambiar el estado')
    }
  }

  async function confirmDelete() {
    try {
      await deleteGoal(toDelete.id).unwrap()
      toast.success('Meta eliminada')
    } catch (err) {
      toast.error(err?.message ?? 'No se pudo eliminar')
    } finally {
      setToDelete(null)
    }
  }

  const cardProps = {
    onAllocate: (g) => setMovement({ open: true, goal: g, type: 'ALLOCATE' }),
    onRelease: (g) => setMovement({ open: true, goal: g, type: 'RELEASE' }),
    onEdit: (g) => setDialog({ open: true, goal: g }),
    onDetails: (g) => setDetail({ open: true, goal: g }),
    onReconcile: (g) => setReconcile({ open: true, goal: g }),
    onArchiveToggle: handleArchiveToggle,
    onWithdrawAll: setToWithdrawAll,
    onDelete: setToDelete,
  }

  return (
    <>
      <PageHeader
        title="Metas"
        description="Reservá parte del pozo para tus objetivos, sin gastarlo."
        actions={
          <Button onClick={() => setDialog({ open: true, goal: null })}>
            <Plus className="h-4 w-4" />
            Nueva
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-lg" />
          ))}
        </div>
      ) : !goals.length ? (
        <EmptyState
          icon={Target}
          title="Sin metas"
          description="Creá una meta para empezar a reservar plata hacia un objetivo."
          action={
            <Button onClick={() => setDialog({ open: true, goal: null })}>
              <Plus className="h-4 w-4" />
              Nueva meta
            </Button>
          }
        />
      ) : (
        <div className="space-y-8">
          {reservedByCurrency.length > 0 && (
            <div className="flex flex-col gap-1 rounded-lg border border-border bg-secondary/40 p-4">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                Total reservado
              </span>
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                {reservedByCurrency.map(([currency, total]) => (
                  <MoneyAmount key={currency} value={total} currency={currency} size="lg" />
                ))}
              </div>
            </div>
          )}
          {active.length > 0 && (
            <Section title="Metas" count={active.length}>
              {active.map((g) => (
                <GoalCard key={g.id} goal={g} children={childrenOf(g.id)} {...cardProps} />
              ))}
            </Section>
          )}
          {archived.length > 0 && (
            <Section title="Archivadas" count={archived.length}>
              {archived.map((g) => (
                <GoalCard key={g.id} goal={g} children={childrenOf(g.id)} {...cardProps} />
              ))}
            </Section>
          )}
          <GoalActivityTable />
        </div>
      )}

      <GoalDialog
        open={dialog.open}
        goal={dialog.goal}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
      />
      <GoalMovementDialog
        open={movement.open}
        goal={movement.goal}
        type={movement.type}
        onOpenChange={(open) => setMovement((m) => ({ ...m, open }))}
      />
      <GoalDetailDialog
        open={detail.open}
        goal={detail.goal}
        onOpenChange={(open) => setDetail((d) => ({ ...d, open }))}
      />
      <GoalReconcileDialog
        open={reconcile.open}
        goal={reconcile.goal}
        onOpenChange={(open) => setReconcile((r) => ({ ...r, open }))}
      />
      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Eliminar meta"
        description={`Se eliminará "${toDelete?.name}" y se liberará lo reservado al disponible.`}
        confirmLabel="Eliminar"
        onConfirm={confirmDelete}
      />
      <ConfirmDialog
        open={Boolean(toWithdrawAll)}
        onOpenChange={(o) => !o && setToWithdrawAll(null)}
        title="Retirar todo"
        description={`Se liberará todo lo reservado de "${toWithdrawAll?.name}" al disponible. La meta queda en cero.`}
        confirmLabel="Retirar todo"
        onConfirm={confirmWithdrawAll}
      />
    </>
  )
}
