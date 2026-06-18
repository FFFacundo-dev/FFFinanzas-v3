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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CurrencySelect } from '@/components/common/EntitySelects'
import { useCreateBudgetItemMutation } from '../budgetApi'

function BudgetItemForm({ periodMonth, onClose }) {
  const [createItem, { isLoading }] = useCreateBudgetItemMutation()
  const [form, setForm] = useState({
    label: '',
    amount: '',
    currency_code: 'ARS',
    flow_type: 'EXPENSE',
  })
  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.label.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }
    if (!(Number(form.amount) > 0)) {
      toast.error('El monto debe ser mayor a cero')
      return
    }
    try {
      await createItem({
        period_month: periodMonth,
        label: form.label.trim(),
        amount: Number(form.amount),
        currency_code: form.currency_code,
        flow_type: form.flow_type,
        item_type: 'ONE_TIME',
      }).unwrap()
      toast.success('Ítem agregado')
      onClose()
    } catch (err) {
      toast.error(err?.message ?? 'No se pudo agregar')
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display">Ítem de presupuesto</DialogTitle>
        <DialogDescription>Un ingreso o gasto hipotético para este mes.</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Tabs value={form.flow_type} onValueChange={(v) => set('flow_type', v)}>
          <TabsList className="w-full">
            <TabsTrigger value="EXPENSE" className="flex-1">
              Gasto
            </TabsTrigger>
            <TabsTrigger value="INCOME" className="flex-1">
              Ingreso
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bi-label">Nombre</Label>
          <Input
            id="bi-label"
            required
            value={form.label}
            onChange={(e) => set('label', e.target.value)}
            placeholder="Ej. Regalo de cumpleaños"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="bi-amount">Monto</Label>
            <Input
              id="bi-amount"
              type="number"
              step="0.01"
              min="0"
              required
              value={form.amount}
              onChange={(e) => set('amount', e.target.value)}
              placeholder="0,00"
              className="font-mono tabular"
            />
          </div>
          <div className="flex w-28 flex-col gap-1.5">
            <Label>Moneda</Label>
            <CurrencySelect value={form.currency_code} onChange={(v) => set('currency_code', v)} />
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Guardando…' : 'Agregar'}
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}

export function AddBudgetItemDialog({ open, onOpenChange, periodMonth }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && <BudgetItemForm periodMonth={periodMonth} onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}
