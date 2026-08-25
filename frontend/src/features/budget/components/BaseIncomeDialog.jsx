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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MoneyInput } from '@/components/common/MoneyInput'
import {
  useSetGeneralBaseIncomeMutation,
  useSetBudgetBaseIncomeMutation,
} from '../budgetApi'

// Edita el sueldo base (ARS) de un presupuesto: solo este (override) o general (todos).
function BaseIncomeForm({ budgetId, initialAmount, initialScope, onClose }) {
  const [amount, setAmount] = useState(String(initialAmount ?? ''))
  const [scope, setScope] = useState(initialScope === 'BUDGET' ? 'BUDGET' : 'GENERAL')
  const [setGeneral] = useSetGeneralBaseIncomeMutation()
  const [setOverride] = useSetBudgetBaseIncomeMutation()
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    const value = Number(amount || 0)
    setSaving(true)
    try {
      if (scope === 'GENERAL') {
        // General: guarda el valor y limpia el override para que este presupuesto lo herede.
        await setGeneral(value).unwrap()
        await setOverride({ id: budgetId, amount: null }).unwrap()
      } else {
        await setOverride({ id: budgetId, amount: value }).unwrap()
      }
      toast.success('Sueldo base actualizado')
      onClose()
    } catch (err) {
      toast.error(err?.message ?? 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="base-income-amount">Monto (ARS)</Label>
        <MoneyInput id="base-income-amount" autoFocus value={amount} onChange={setAmount} placeholder="0" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Aplicar a</Label>
        <Select value={scope} onValueChange={setScope}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GENERAL">General (todos los presupuestos)</SelectItem>
            <SelectItem value="BUDGET">Solo este presupuesto</SelectItem>
          </SelectContent>
        </Select>
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

export function BaseIncomeDialog({ open, onOpenChange, budgetId, initialAmount, initialScope }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        {open && (
          <>
            <DialogHeader>
              <DialogTitle className="font-display">Sueldo base</DialogTitle>
              <DialogDescription>Ingreso base en ARS que se suma a este presupuesto.</DialogDescription>
            </DialogHeader>
            <BaseIncomeForm
              budgetId={budgetId}
              initialAmount={initialAmount}
              initialScope={initialScope}
              onClose={() => onOpenChange(false)}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
