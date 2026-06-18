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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CurrencySelect,
  CategorySelect,
  AccountSelect,
  NONE,
} from '@/components/common/EntitySelects'
import { toInputDate } from '@/lib/format'
import {
  useCreateSubscriptionMutation,
  useUpdateSubscriptionMutation,
} from '../subscriptionsApi'

const STATUSES = [
  { value: 'ACTIVE', label: 'Activa' },
  { value: 'PAUSED', label: 'Pausada' },
  { value: 'CANCELLED', label: 'Cancelada' },
]

function initialForm(sub) {
  if (sub) {
    return {
      name: sub.name ?? '',
      default_amount: sub.default_amount != null ? String(sub.default_amount) : '',
      currency_code: sub.currency_code ?? 'ARS',
      category_id: sub.category_id ?? NONE,
      account_id: sub.account_id ?? NONE,
      billing_day: sub.billing_day != null ? String(sub.billing_day) : '',
      start_date: sub.start_date ? toInputDate(sub.start_date) : toInputDate(new Date()),
      status: sub.status ?? 'ACTIVE',
    }
  }
  return {
    name: '',
    default_amount: '',
    currency_code: 'ARS',
    category_id: NONE,
    account_id: NONE,
    billing_day: '',
    start_date: toInputDate(new Date()),
    status: 'ACTIVE',
  }
}

function SubscriptionForm({ subscription, onClose }) {
  const isEdit = Boolean(subscription)
  const [createSub, createState] = useCreateSubscriptionMutation()
  const [updateSub, updateState] = useUpdateSubscriptionMutation()
  const saving = createState.isLoading || updateState.isLoading
  const [form, setForm] = useState(() => initialForm(subscription))

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }
    const body = {
      name: form.name.trim(),
      currency_code: form.currency_code,
      default_amount: form.default_amount ? Number(form.default_amount) : null,
      category_id: form.category_id === NONE ? null : form.category_id,
      account_id: form.account_id === NONE ? null : form.account_id,
      billing_day: form.billing_day ? Number(form.billing_day) : null,
      start_date: form.start_date || null,
      status: form.status,
    }
    try {
      if (isEdit) {
        await updateSub({ id: subscription.id, ...body }).unwrap()
        toast.success('Suscripción actualizada')
      } else {
        await createSub(body).unwrap()
        toast.success('Suscripción creada')
      }
      onClose()
    } catch (err) {
      toast.error(err?.message ?? 'No se pudo guardar')
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display">
          {isEdit ? 'Editar suscripción' : 'Nueva suscripción'}
        </DialogTitle>
        <DialogDescription>
          Gasto recurrente. Cada pago genera un egreso con su moneda y medio.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sub-name">Nombre</Label>
          <Input
            id="sub-name"
            required
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Ej. Netflix"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="sub-amount">Monto mensual</Label>
            <Input
              id="sub-amount"
              type="number"
              step="0.01"
              min="0"
              value={form.default_amount}
              onChange={(e) => set('default_amount', e.target.value)}
              placeholder="0,00"
              className="font-mono tabular"
            />
          </div>
          <div className="flex w-28 flex-col gap-1.5">
            <Label>Moneda</Label>
            <CurrencySelect value={form.currency_code} onChange={(v) => set('currency_code', v)} />
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label>Categoría</Label>
            <CategorySelect value={form.category_id} onChange={(v) => set('category_id', v)} />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <Label>Medio (opcional)</Label>
            <AccountSelect value={form.account_id} onChange={(v) => set('account_id', v)} optional />
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex w-28 flex-col gap-1.5">
            <Label htmlFor="sub-day">Día de cobro</Label>
            <Input
              id="sub-day"
              type="number"
              min="1"
              max="31"
              value={form.billing_day}
              onChange={(e) => set('billing_day', e.target.value)}
              placeholder="1-31"
              className="font-mono tabular"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <Label>Estado</Label>
            <Select value={form.status} onValueChange={(v) => set('status', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Guardando…' : isEdit ? 'Guardar' : 'Crear'}
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}

export function SubscriptionDialog({ open, onOpenChange, subscription }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {open && (
          <SubscriptionForm subscription={subscription} onClose={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  )
}
