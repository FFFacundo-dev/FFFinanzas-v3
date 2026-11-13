import { useState } from 'react'
import { toast } from 'sonner'
import { Target, ArrowCircleDown } from '@phosphor-icons/react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { MoneyInput } from '@/components/common/MoneyInput'
import { Label } from '@/components/ui/label'
import { MoneyAmount } from '@/components/common/MoneyAmount'
import { useGetBalancesSummaryQuery } from '@/features/dashboard/dashboardApi'
import { useCreateGoalMovementMutation } from '../goalsApi'
import { runMutation } from '@/lib/mutation'

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

  // "Completar meta": aporta exactamente lo que falta para llegar al objetivo.
  // Redondeo a centavos para no arrastrar ruido de float (0.30000000000000004).
  const remaining =
    goal.target_amount != null
      ? Math.round((Number(goal.target_amount) - current) * 100) / 100
      : 0
  // Acción rápida: al aportar "Completar meta" (lo que falta); al retirar "Retirar todo" (lo reservado).
  const quick = isAllocate
    ? { show: remaining > 0, amount: remaining, label: 'Completar meta', icon: Target, success: '¡Meta completada!' }
    : { show: current > 0, amount: current, label: 'Retirar todo', icon: ArrowCircleDown, success: 'Se retiró todo lo reservado de la meta' }
  const showFill = quick.show
  const canFill = showFill && quick.amount <= limit + 1e-9
  const QuickIcon = quick.icon

  async function submit(v) {
    const { ok } = await runMutation(createMovement({ id: goal.id, movement_type: type, amount: v }), { success: isAllocate ? 'Aporte registrado' : 'Retiro registrado', error: 'No se pudo registrar' })
    if (ok) onClose()
  }

  async function handleFill() {
    const { ok } = await runMutation(createMovement({ id: goal.id, movement_type: type, amount: quick.amount }), { success: quick.success, error: 'No se pudo registrar' })
    if (ok) onClose()
  }

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
    await submit(value)
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

        {showFill && (
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              size="lg"
              className="h-auto w-full justify-between gap-3 py-3"
              onClick={handleFill}
              disabled={isLoading || !canFill}
            >
              <span className="flex items-center gap-2">
                <QuickIcon className="h-5 w-5" weight="bold" />
                {quick.label}
              </span>
              <MoneyAmount
                value={quick.amount}
                currency={goal.currency_code}
                size="md"
                className="text-primary-foreground"
              />
            </Button>
            {!canFill && (
              <p className="text-xs text-expense-foreground">
                No te alcanza el disponible para completarla.
              </p>
            )}
            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              o un monto personalizado
              <span className="h-px flex-1 bg-border" />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="gm-amount">Monto</Label>
          <MoneyInput
            id="gm-amount"
            required
            autoFocus={!showFill}
            value={amount}
            onChange={setAmount}
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
          <Button type="submit" variant={showFill ? 'outline' : 'default'} disabled={isLoading || !valid}>
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
