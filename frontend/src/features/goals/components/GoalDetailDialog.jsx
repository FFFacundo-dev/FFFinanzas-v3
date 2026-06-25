import { Plus, Minus } from '@phosphor-icons/react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { MoneyAmount } from '@/components/common/MoneyAmount'
import { formatDate } from '@/lib/format'
import { useGetGoalMovementsQuery } from '../goalsApi'

function MovementList({ goal }) {
  const { data: movements = [], isLoading } = useGetGoalMovementsQuery(goal.id)

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-sm" />
        ))}
      </div>
    )
  }

  if (!movements.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Esta meta todavía no tiene movimientos.
      </p>
    )
  }

  return (
    <ScrollArea className="max-h-80">
      <div className="flex flex-col gap-1.5 pr-3">
        {movements.map((m) => {
          const isAllocate = m.movement_type === 'ALLOCATE'
          return (
            <div
              key={m.id}
              className="flex items-center justify-between gap-3 rounded-sm border border-border px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-sm ${
                    isAllocate
                      ? 'bg-income text-income-foreground'
                      : 'bg-expense text-expense-foreground'
                  }`}
                >
                  {isAllocate ? <Plus className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                </span>
                <div className="flex flex-col">
                  <span className="text-sm text-foreground">{isAllocate ? 'Aporte' : 'Retiro'}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(m.date)}</span>
                </div>
              </div>
              <MoneyAmount
                value={Number(m.amount)}
                currency={goal.currency_code}
                size="sm"
                tone={isAllocate ? 'income' : 'expense'}
                signed
              />
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}

export function GoalDetailDialog({ open, onOpenChange, goal }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && goal && (
          <>
            <DialogHeader>
              <DialogTitle className="font-display">{goal.name}</DialogTitle>
              <DialogDescription>
                Aportes y retiros de esta meta · {goal.currency_code}
              </DialogDescription>
            </DialogHeader>
            <MovementList goal={goal} />
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
