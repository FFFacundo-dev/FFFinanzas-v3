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
import { CurrencySelect } from '@/components/common/EntitySelects'
import { useCreateBudgetItemMutation } from '../budgetApi'

function BudgetItemForm({ budgetId, onClose }) {
  const [createItem, { isLoading }] = useCreateBudgetItemMutation()
  const [form, setForm] = useState({
    label: '',
    flow_type: 'EXPENSE',
    amount: '',
    currency_code: 'ARS',
    // Solo para "Cambio": sale en una moneda, entra en otra.
    out_amount: '',
    out_currency: 'USD',
    in_amount: '',
    in_currency: 'ARS',
  })
  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }))
  const isChange = form.flow_type === 'CHANGE'

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.label.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }

    // Cambio = dos patas (EXPENSE sale + INCOME entra); el resumen ya resta/suma.
    if (isChange) {
      const out = Number(form.out_amount)
      const inn = Number(form.in_amount)
      if (!(out > 0) || !(inn > 0)) {
        toast.error('Los montos deben ser mayores a cero')
        return
      }
      if (form.out_currency === form.in_currency) {
        toast.error('La moneda que sale y la que entra deben ser distintas')
        return
      }
      const label = `Cambio ${form.out_currency}→${form.in_currency}: ${form.label.trim()}`
      try {
        await createItem({
          budget_id: budgetId,
          label,
          amount: out,
          currency_code: form.out_currency,
          flow_type: 'EXPENSE',
          item_type: 'ONE_TIME',
        }).unwrap()
        await createItem({
          budget_id: budgetId,
          label,
          amount: inn,
          currency_code: form.in_currency,
          flow_type: 'INCOME',
          item_type: 'ONE_TIME',
        }).unwrap()
        toast.success('Cambio agregado')
        onClose()
      } catch (err) {
        toast.error(err?.message ?? 'No se pudo agregar')
      }
      return
    }

    if (!(Number(form.amount) > 0)) {
      toast.error('El monto debe ser mayor a cero')
      return
    }
    try {
      await createItem({
        budget_id: budgetId,
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
        <DialogDescription>Un ingreso, gasto o cambio hipotético para este mes.</DialogDescription>
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
            <TabsTrigger value="CHANGE" className="flex-1">
              Cambio
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
            placeholder={isChange ? 'Ej. compra de dólares' : 'Ej. Regalo de cumpleaños'}
          />
        </div>

        {isChange ? (
          <>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor="bi-out-amount">Sale</Label>
                <MoneyInput
                  id="bi-out-amount"
                  required
                  value={form.out_amount}
                  onChange={(v) => set('out_amount', v)}
                  placeholder="0,00"
                  className="font-mono tabular"
                />
              </div>
              <div className="flex w-28 flex-col gap-1.5">
                <Label>Moneda</Label>
                <CurrencySelect value={form.out_currency} onChange={(v) => set('out_currency', v)} />
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor="bi-in-amount">Entra</Label>
                <MoneyInput
                  id="bi-in-amount"
                  required
                  value={form.in_amount}
                  onChange={(v) => set('in_amount', v)}
                  placeholder="0,00"
                  className="font-mono tabular"
                />
              </div>
              <div className="flex w-28 flex-col gap-1.5">
                <Label>Moneda</Label>
                <CurrencySelect value={form.in_currency} onChange={(v) => set('in_currency', v)} />
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="bi-amount">Monto</Label>
              <MoneyInput
                id="bi-amount"
                required
                value={form.amount}
                onChange={(v) => set('amount', v)}
                placeholder="0,00"
                className="font-mono tabular"
              />
            </div>
            <div className="flex w-28 flex-col gap-1.5">
              <Label>Moneda</Label>
              <CurrencySelect value={form.currency_code} onChange={(v) => set('currency_code', v)} />
            </div>
          </div>
        )}

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

export function AddBudgetItemDialog({ open, onOpenChange, budgetId }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && <BudgetItemForm budgetId={budgetId} onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}
