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
import { MoneyInput } from '@/components/common/MoneyInput'
import { Label } from '@/components/ui/label'
import { AccountSelect, GoalSelect, NONE } from '@/components/common/EntitySelects'
import { toInputDate } from '@/lib/format'
import { usePayInstallmentMutation } from '../installmentsApi'

function PayForm({ installment, onClose }) {
  const [payInstallment, { isLoading }] = usePayInstallmentMutation()
  const nextNumber = (installment.total_paid ?? 0) + 1
  const [form, setForm] = useState(() => ({
    amount: installment.default_amount != null ? String(installment.default_amount) : '',
    account_id: installment.account_id ?? NONE,
    goal_id: NONE,
    payment_date: toInputDate(new Date()),
  }))
  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }))

  async function handleSubmit(e) {
    e.preventDefault()
    const amount = Number(form.amount)
    if (!(amount > 0)) {
      toast.error('El monto debe ser mayor a cero')
      return
    }
    try {
      await payInstallment({
        installment_id: installment.installment_id,
        installment_number: nextNumber,
        amount_override: amount,
        account_id: form.account_id === NONE ? null : form.account_id,
        goal_id: form.goal_id === NONE ? null : form.goal_id,
        payment_date: form.payment_date,
      }).unwrap()
      toast.success(`Cuota ${nextNumber} pagada`)
      onClose()
    } catch (err) {
      toast.error(err?.message ?? 'No se pudo pagar')
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display">Pagar cuota {nextNumber}</DialogTitle>
        <DialogDescription>
          {installment.description} · de {installment.total_installments} · genera un gasto en{' '}
          {installment.currency_code}.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pi-amount">Monto</Label>
          <MoneyInput
            id="pi-amount"
            required
            value={form.amount}
            onChange={(v) => set('amount', v)}
            className="font-mono tabular"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Medio (opcional)</Label>
          <AccountSelect value={form.account_id} onChange={(v) => set('account_id', v)} optional />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Pagar desde meta (opcional)</Label>
          <GoalSelect
            value={form.goal_id}
            onChange={(v) => set('goal_id', v)}
            currency={installment.currency_code}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pi-date">Fecha de pago</Label>
          <Input
            id="pi-date"
            type="date"
            required
            value={form.payment_date}
            onChange={(e) => set('payment_date', e.target.value)}
            className="font-mono tabular"
          />
        </div>

        <DialogFooter className="mt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Guardando…' : 'Pagar'}
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}

export function PayInstallmentDialog({ open, onOpenChange, installment }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && installment && (
          <PayForm installment={installment} onClose={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  )
}
