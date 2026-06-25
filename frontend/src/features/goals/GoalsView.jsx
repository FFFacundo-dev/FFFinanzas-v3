import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Target } from '@phosphor-icons/react'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useGetGoalsQuery,
  usePatchGoalStatusMutation,
  useDeleteGoalMutation,
} from './goalsApi'
import { GoalCard } from './components/GoalCard'
import { GoalDialog } from './components/GoalDialog'
import { GoalMovementDialog } from './components/GoalMovementDialog'
import { GoalDetailDialog } from './components/GoalDetailDialog'
import { GoalReconcileDialog } from './components/GoalReconcileDialog'

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

  const [dialog, setDialog] = useState({ open: false, goal: null })
  const [movement, setMovement] = useState({ open: false, goal: null, type: 'ALLOCATE' })
  const [detail, setDetail] = useState({ open: false, goal: null })
  const [reconcile, setReconcile] = useState({ open: false, goal: null })
  const [toDelete, setToDelete] = useState(null)

  const childrenOf = (id) => goals.filter((g) => g.parent_id === id)
  // Las hijas no van a la grilla: solo se ven anidadas dentro de su meta padre.
  const topLevel = goals.filter((g) => g.parent_id == null)
  const active = topLevel.filter((g) => g.status === 'ACTIVE' && !g.is_completed)
  const completed = topLevel.filter((g) => g.status === 'ACTIVE' && g.is_completed)
  const archived = topLevel.filter((g) => g.status === 'ARCHIVED')

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
          {active.length > 0 && (
            <Section title="Activas" count={active.length}>
              {active.map((g) => (
                <GoalCard key={g.id} goal={g} children={childrenOf(g.id)} {...cardProps} />
              ))}
            </Section>
          )}
          {completed.length > 0 && (
            <Section title="Completadas" count={completed.length}>
              {completed.map((g) => (
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
    </>
  )
}
