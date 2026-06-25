import { useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { MoneyInput } from '@/components/common/MoneyInput'
import { MoneyAmount } from '@/components/common/MoneyAmount'
import { useCreateGoalMovementMutation } from '../goalsApi'

/**
 * Concilia el saldo reservado de UNA meta: el usuario ingresa el monto real y
 * se registra el ajuste como goal_movement (ALLOCATE si falta, RELEASE si sobra).
 * No genera transacción del pozo: reusa createGoalMovement y sus validaciones.
 */
function GoalReconcileForm({ goal, onClose }) {
  const [createMovement, { isLoading }] = useCreateGoalMovementMutation()
  const [real, setReal] = useState('')

  const current = Number(goal.current_amount)
  const realNum = Number(real)
  const hasReal = real !== '' && Number.isFinite(realNum)
  const diff = hasReal ? Number((realNum - current).toFixed(2)) : 0

  async function handleSubmit(e) {
    e.preventDefault()
    if (!hasReal) {
      toast.error('Ingresá cuánto tiene realmente la meta')
      return
    }
    if (diff === 0) {
      toast.info('La meta ya coincide, no hace falta ajustar')
      onClose()
      return
    }
    try {
      await createMovement({
        id: goal.id,
        movement_type: diff > 0 ? 'ALLOCATE' : 'RELEASE',
        amount: Math.abs(diff),
      }).unwrap()
      toast.success('Meta conciliada')
      onClose()
    } catch (err) {
      toast.error(err?.message ?? 'No se pudo conciliar')
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display">Conciliar {goal.name}</DialogTitle>
        <DialogDescription>
          Ingresá cuánto debería tener reservado esta meta y se ajusta la diferencia.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex items-center justify-between rounded-sm border border-border bg-secondary/40 px-3 py-2 text-sm">
          <span className="text-muted-foreground">Reservado actual</span>
          <MoneyAmount value={current} currency={goal.currency_code} size="sm" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="goal-rec-real">Monto real</Label>
          <MoneyInput
            id="goal-rec-real"
            required
            autoFocus
            value={real}
            onChange={setReal}
            placeholder="0,00"
            className="font-mono tabular"
          />
        </div>

        {hasReal && diff !== 0 && (
          <div className="flex items-center justify-between rounded-sm border border-border px-3 py-2 text-sm">
            <span className="text-muted-foreground">
              Ajuste: {diff > 0 ? 'aporte' : 'retiro'}
            </span>
            <MoneyAmount
              value={Math.abs(diff)}
              currency={goal.currency_code}
              tone={diff > 0 ? 'income' : 'expense'}
              signed
              size="sm"
            />
          </div>
        )}

        <DialogFooter className="mt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Guardando…' : 'Conciliar'}
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}

export function GoalReconcileDialog({ open, onOpenChange, goal }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && goal && (
          <GoalReconcileForm goal={goal} onClose={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  )
}
