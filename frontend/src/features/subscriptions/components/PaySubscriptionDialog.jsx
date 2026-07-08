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
import { AccountSelect, NONE } from '@/components/common/EntitySelects'
import { toInputDate } from '@/lib/format'
import { usePaySubscriptionMutation } from '../subscriptionsApi'

function currentMonth() {
  return toInputDate(new Date()).slice(0, 7) // YYYY-MM
}

function PayForm({ subscription, onClose }) {
  const [paySub, { isLoading }] = usePaySubscriptionMutation()
  const [form, setForm] = useState(() => ({
    amount: subscription.default_amount != null ? String(subscription.default_amount) : '',
    account_id: subscription.account_id ?? NONE,
    payment_date: toInputDate(new Date()),
    period_month: currentMonth(),
    notes: '',
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
      await paySub({
        subscription_id: subscription.id,
        amount,
        account_id: form.account_id === NONE ? null : form.account_id,
        payment_date: form.payment_date,
        period_month: `${form.period_month}-01`,
        notes: form.notes.trim() || null,
      }).unwrap()
      toast.success('Pago registrado')
      onClose()
    } catch (err) {
      toast.error(err?.message ?? 'No se pudo registrar el pago')
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display">Registrar pago</DialogTitle>
        <DialogDescription>
          {subscription.name} · genera un gasto en {subscription.currency_code}.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="pay-amount">Monto</Label>
            <MoneyInput
              id="pay-amount"
              required
              value={form.amount}
              onChange={(v) => set('amount', v)}
              className="font-mono tabular"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <Label>Período</Label>
            <Input
              type="month"
              required
              value={form.period_month}
              onChange={(e) => set('period_month', e.target.value)}
              className="font-mono tabular"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Medio (opcional)</Label>
          <AccountSelect value={form.account_id} onChange={(v) => set('account_id', v)} optional />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pay-date">Fecha de pago</Label>
          <Input
            id="pay-date"
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
            {isLoading ? 'Guardando…' : 'Registrar pago'}
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}

export function PaySubscriptionDialog({ open, onOpenChange, subscription }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && subscription && (
          <PayForm subscription={subscription} onClose={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  )
}
