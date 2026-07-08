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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  CurrencySelect,
  CategorySelect,
  AccountSelect,
  NONE,
} from '@/components/common/EntitySelects'
import { toInputDate } from '@/lib/format'
import { useCreateInstallmentMutation } from '../installmentsApi'

function initialForm() {
  return {
    description: '',
    total_amount: '',
    mode: 'auto',
    total_installments: '',
    installment_amount: '',
    currency_code: 'ARS',
    category_id: NONE,
    account_id: NONE,
    start_date: toInputDate(new Date()),
    paid_installments_initial: '0',
  }
}

function InstallmentForm({ onClose }) {
  const [createInstallment, { isLoading }] = useCreateInstallmentMutation()
  const [form, setForm] = useState(initialForm)
  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }))

  const totalAmount = Number(form.total_amount)
  const preview =
    form.mode === 'auto' && totalAmount > 0 && Number(form.total_installments) > 0
      ? totalAmount / Number(form.total_installments)
      : form.mode === 'custom' && Number(form.installment_amount) > 0
        ? Number(form.installment_amount)
        : null

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.description.trim()) {
      toast.error('La descripción es obligatoria')
      return
    }
    if (!(totalAmount > 0)) {
      toast.error('El total debe ser mayor a cero')
      return
    }

    const common = {
      description: form.description.trim(),
      total_amount: totalAmount,
      currency_code: form.currency_code,
      category_id: form.category_id === NONE ? null : form.category_id,
      account_id: form.account_id === NONE ? null : form.account_id,
      start_date: form.start_date,
      paid_installments_initial: Number(form.paid_installments_initial) || 0,
    }
    const body =
      form.mode === 'auto'
        ? { ...common, mode: 'auto', total_installments: Number(form.total_installments) }
        : { ...common, mode: 'custom', installment_amount: Number(form.installment_amount) }

    if (form.mode === 'auto' && !(Number(form.total_installments) > 0)) {
      toast.error('Indicá la cantidad de cuotas')
      return
    }
    if (form.mode === 'custom' && !(Number(form.installment_amount) > 0)) {
      toast.error('Indicá el monto de cada cuota')
      return
    }

    try {
      await createInstallment(body).unwrap()
      toast.success('Cuota creada')
      onClose()
    } catch (err) {
      toast.error(err?.message ?? 'No se pudo crear')
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display">Nueva compra en cuotas</DialogTitle>
        <DialogDescription>
          El total se reparte; cada pago genera un gasto con su moneda y medio.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="inst-desc">Descripción</Label>
          <Input
            id="inst-desc"
            required
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Ej. Heladera"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="inst-total">Total</Label>
            <MoneyInput
              id="inst-total"
              required
              value={form.total_amount}
              onChange={(v) => set('total_amount', v)}
              placeholder="0,00"
              className="font-mono tabular"
            />
          </div>
          <div className="flex w-28 flex-col gap-1.5">
            <Label>Moneda</Label>
            <CurrencySelect value={form.currency_code} onChange={(v) => set('currency_code', v)} />
          </div>
        </div>

        <Tabs value={form.mode} onValueChange={(v) => set('mode', v)}>
          <TabsList className="w-full">
            <TabsTrigger value="auto" className="flex-1">
              Por cantidad
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex-1">
              Por monto de cuota
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {form.mode === 'auto' ? (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="inst-count">Cantidad de cuotas</Label>
            <Input
              id="inst-count"
              type="number"
              min="1"
              value={form.total_installments}
              onChange={(e) => set('total_installments', e.target.value)}
              placeholder="Ej. 12"
              className="font-mono tabular"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="inst-amount">Monto de cada cuota</Label>
            <MoneyInput
              id="inst-amount"
              value={form.installment_amount}
              onChange={(v) => set('installment_amount', v)}
              placeholder="0,00"
              className="font-mono tabular"
            />
          </div>
        )}

        {preview && (
          <p className="rounded-sm border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
            Cuota aproximada:{' '}
            <span className="font-mono tabular text-foreground">
              {preview.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
              {form.currency_code}
            </span>
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label>Categoría</Label>
            <CategorySelect value={form.category_id} onChange={(v) => set('category_id', v)} />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <Label>Medio (opcional)</Label>
            <AccountSelect value={form.account_id} onChange={(v) => set('account_id', v)} optional />
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="inst-start">Inicio</Label>
            <Input
              id="inst-start"
              type="date"
              required
              value={form.start_date}
              onChange={(e) => set('start_date', e.target.value)}
              className="font-mono tabular"
            />
          </div>
          <div className="flex w-32 flex-col gap-1.5">
            <Label htmlFor="inst-paid">Ya pagadas</Label>
            <Input
              id="inst-paid"
              type="number"
              min="0"
              value={form.paid_installments_initial}
              onChange={(e) => set('paid_installments_initial', e.target.value)}
              className="font-mono tabular"
            />
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Guardando…' : 'Crear'}
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}

export function CreateInstallmentDialog({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {open && <InstallmentForm onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}
