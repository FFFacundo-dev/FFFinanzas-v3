import { useState } from 'react'
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
import {
  useSetGeneralBaseIncomeMutation,
  useSetBudgetBaseIncomeMutation,
} from '../budgetApi'
import { runMutation } from '@/lib/mutation'

// Con budgetId edita solo ese presupuesto (override); sin él, el sueldo base general.
function BaseIncomeForm({ budgetId, initialAmount, onClose }) {
  const [amount, setAmount] = useState(String(initialAmount ?? ''))
  const [setGeneral] = useSetGeneralBaseIncomeMutation()
  const [setOverride] = useSetBudgetBaseIncomeMutation()
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    const value = Number(amount || 0)
    setSaving(true)
    const { ok } = await runMutation(
      budgetId ? setOverride({ id: budgetId, amount: value }) : setGeneral(value),
      { success: 'Sueldo base actualizado', error: 'No se pudo guardar' },
    )
    setSaving(false)
    if (ok) onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="base-income-amount">Monto (ARS)</Label>
        <MoneyInput id="base-income-amount" autoFocus value={amount} onChange={setAmount} placeholder="0" />
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function BaseIncomeDialog({ open, onOpenChange, budgetId, initialAmount }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        {open && (
          <>
            <DialogHeader>
              <DialogTitle className="font-display">
                {budgetId ? 'Sueldo base del presupuesto' : 'Sueldo base general'}
              </DialogTitle>
              <DialogDescription>
                {budgetId
                  ? 'Ingreso base en ARS solo para este presupuesto. No cambia el general.'
                  : 'Ingreso base en ARS por defecto para los presupuestos sin monto propio.'}
              </DialogDescription>
            </DialogHeader>
            <BaseIncomeForm
              budgetId={budgetId}
              initialAmount={initialAmount}
              onClose={() => onOpenChange(false)}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
