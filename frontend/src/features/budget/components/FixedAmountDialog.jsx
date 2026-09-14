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
import { formatCurrency } from '@/lib/format'
import { useSetBudgetFixedOverrideMutation } from '../budgetApi'

// Monto hipotético de un gasto fijo dentro de este presupuesto.
// No toca la suscripción/cuota original: el valor real sigue igual en todos lados.
function FixedAmountForm({ budgetId, item, onClose }) {
  const [amount, setAmount] = useState(String(item.override_amount ?? item.base_amount ?? ''))
  const [setOverride] = useSetBudgetFixedOverrideMutation()
  const [saving, setSaving] = useState(false)

  async function save(value) {
    setSaving(true)
    try {
      await setOverride({
        id: budgetId,
        sourceId: item.source_id,
        included: !!item.included,
        amount: value,
      }).unwrap()
      toast.success(value == null ? 'Monto real restaurado' : 'Monto actualizado en este presupuesto')
      onClose()
    } catch (err) {
      toast.error(err?.message ?? 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    const value = Number(amount || 0)
    if (!(value > 0)) {
      toast.error('El monto debe ser mayor a 0')
      return
    }
    save(value)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fixed-amount">Monto ({item.currency_code})</Label>
        <MoneyInput id="fixed-amount" autoFocus value={amount} onChange={setAmount} placeholder="0" />
        <p className="text-xs text-muted-foreground">
          Monto real: {formatCurrency(item.base_amount, item.currency_code)}
        </p>
      </div>
      <DialogFooter className="gap-2 sm:justify-between">
        {item.override_amount != null ? (
          <Button type="button" variant="ghost" onClick={() => save(null)} disabled={saving}>
            Restaurar monto real
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </Button>
        </div>
      </DialogFooter>
    </form>
  )
}

export function FixedAmountDialog({ open, onOpenChange, budgetId, item }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        {open && item && (
          <>
            <DialogHeader>
              <DialogTitle className="font-display">{item.label}</DialogTitle>
              <DialogDescription>
                Monto hipotético solo para este presupuesto. No cambia el valor real del gasto fijo.
              </DialogDescription>
            </DialogHeader>
            <FixedAmountForm budgetId={budgetId} item={item} onClose={() => onOpenChange(false)} />
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
