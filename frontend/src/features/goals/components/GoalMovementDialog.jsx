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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MoneyAmount } from '@/components/common/MoneyAmount'
import { useGetBalancesSummaryQuery } from '@/features/dashboard/dashboardApi'
import { useCreateGoalMovementMutation } from '../goalsApi'

function MovementForm({ goal, type, onClose }) {
  const isAllocate = type === 'ALLOCATE'
  const { data: summary = [] } = useGetBalancesSummaryQuery()
  const [createMovement, { isLoading }] = useCreateGoalMovementMutation()
  const [amount, setAmount] = useState('')

  const available = Number(
    summary.find((s) => s.currency_code === goal.currency_code)?.available_balance ?? 0,
  )
  const current = Number(goal.current_amount)
  const limit = isAllocate ? available : current
  const value = Number(amount)
  const valid = value > 0 && value <= limit + 1e-9

  async function handleSubmit(e) {
    e.preventDefault()
    if (!(value > 0)) {
      toast.error('Ingresá un monto mayor a cero')
      return
    }
    if (value > limit + 1e-9) {
      toast.error(
        isAllocate
          ? 'No tenés suficiente disponible'
          : 'No podés retirar más de lo reservado',
      )
      return
    }
    try {
      await createMovement({ id: goal.id, movement_type: type, amount: value }).unwrap()
      toast.success(isAllocate ? 'Aporte registrado' : 'Retiro registrado')
      onClose()
    } catch (err) {
      toast.error(err?.message ?? 'No se pudo registrar')
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display">
          {isAllocate ? 'Aportar a la meta' : 'Retirar de la meta'}
        </DialogTitle>
        <DialogDescription>
          {goal.name} · {goal.currency_code}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex items-center justify-between rounded-sm border border-border bg-secondary/40 px-3 py-2 text-sm">
          <span className="text-muted-foreground">
            {isAllocate ? 'Disponible' : 'Reservado en la meta'}
          </span>
          <MoneyAmount
            value={limit}
            currency={goal.currency_code}
            size="sm"
            tone={limit < 0 ? 'expense' : 'neutral'}
            signed={limit < 0}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="gm-amount">Monto</Label>
          <Input
            id="gm-amount"
            type="number"
            step="0.01"
            min="0"
            required
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0,00"
            className="font-mono tabular"
          />
          {value > 0 && !valid && (
            <p className="text-xs text-expense-foreground">
              {isAllocate
                ? 'Supera tu disponible en esta moneda.'
                : 'Supera lo reservado en la meta.'}
            </p>
          )}
        </div>

        <DialogFooter className="mt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading || !valid}>
            {isLoading ? 'Guardando…' : isAllocate ? 'Aportar' : 'Retirar'}
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}

export function GoalMovementDialog({ open, onOpenChange, goal, type }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && goal && (
          <MovementForm goal={goal} type={type} onClose={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  )
}
