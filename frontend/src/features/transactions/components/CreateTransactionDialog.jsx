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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toInputDate } from '@/lib/format'
import { useGetCurrenciesQuery } from '@/features/currencies/currenciesApi'
import { useGetCategoriesQuery } from '@/features/categories/categoriesApi'
import { useGetAccountsQuery } from '@/features/accounts/accountsApi'
import {
  useCreateTransactionMutation,
  useUpdateTransactionMutation,
} from '../transactionsApi'

const NONE = '__none__'

function initialForm(transaction, movementType) {
  if (transaction) {
    return {
      amount: String(transaction.amount),
      currency_code: transaction.currency_code,
      account_id: transaction.account_id ?? NONE,
      category_id: transaction.category_id ?? NONE,
      date: toInputDate(transaction.date),
      description: transaction.description ?? '',
    }
  }
  return {
    amount: '',
    currency_code: 'ARS',
    account_id: NONE,
    category_id: NONE,
    date: toInputDate(new Date()),
    description: '',
    movement_type: movementType,
  }
}

/**
 * Form interno. Se monta fresco en cada apertura del Dialog (Radix desmonta el
 * contenido al cerrar), por eso inicializa el estado desde props sin useEffect.
 */
function TransactionForm({ transaction, movementType, onClose }) {
  const isEdit = Boolean(transaction)
  const isExpense = movementType === 'EXPENSE'

  const { data: currencies = [] } = useGetCurrenciesQuery()
  const { data: categories = [] } = useGetCategoriesQuery()
  const { data: accounts = [] } = useGetAccountsQuery()

  const [createTx, createState] = useCreateTransactionMutation()
  const [updateTx, updateState] = useUpdateTransactionMutation()
  const saving = createState.isLoading || updateState.isLoading

  const [form, setForm] = useState(() => initialForm(transaction, movementType))

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()

    const amount = Number(form.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('El monto debe ser mayor a cero')
      return
    }
    if (!form.description.trim()) {
      toast.error('La descripción es obligatoria')
      return
    }
    if (isExpense && form.account_id === NONE) {
      toast.error('El gasto necesita un medio/cuenta')
      return
    }

    const body = {
      movement_type: movementType,
      amount,
      currency_code: form.currency_code,
      category_id: form.category_id === NONE ? null : form.category_id,
      date: form.date,
      description: form.description.trim(),
      account_id: isExpense ? form.account_id : null,
    }

    try {
      if (isEdit) {
        await updateTx({ id: transaction.id, ...body }).unwrap()
        toast.success('Movimiento actualizado')
      } else {
        await createTx(body).unwrap()
        toast.success(isExpense ? 'Gasto registrado' : 'Ingreso registrado')
      }
      onClose()
    } catch (err) {
      toast.error(err?.message ?? 'No se pudo guardar')
    }
  }

  const title = isEdit ? 'Editar movimiento' : isExpense ? 'Nuevo gasto' : 'Nuevo ingreso'

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display">{title}</DialogTitle>
        <DialogDescription>
          {isExpense
            ? 'Sale de un medio/cuenta. La moneda vive en el movimiento.'
            : 'Ingreso del usuario, sin cuenta. La moneda vive en el movimiento.'}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="amount">Monto</Label>
            <MoneyInput
              id="amount"
              required
              value={form.amount}
              onChange={(v) => set('amount', v)}
              placeholder="0,00"
              className="font-mono tabular"
            />
          </div>
          <div className="flex w-28 flex-col gap-1.5">
            <Label>Moneda</Label>
            <Select value={form.currency_code} onValueChange={(v) => set('currency_code', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isExpense && (
          <div className="flex flex-col gap-1.5">
            <Label>Medio / cuenta</Label>
            <Select value={form.account_id} onValueChange={(v) => set('account_id', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Elegí un medio" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label>Categoría</Label>
          <Select value={form.category_id} onValueChange={(v) => set('category_id', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Sin categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Sin categoría</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="date">Fecha</Label>
          <Input
            id="date"
            type="date"
            required
            value={form.date}
            onChange={(e) => set('date', e.target.value)}
            className="font-mono tabular"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">Descripción</Label>
          <Input
            id="description"
            required
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder={isExpense ? 'Ej. Carrefour' : 'Ej. Sueldo'}
          />
        </div>

        <DialogFooter className="mt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Guardando…' : isEdit ? 'Guardar' : 'Registrar'}
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}

/**
 * Dialog controlado para Ingreso/Gasto (PLAN §5.3). Regla del modelo:
 * EXPENSE requiere cuenta/medio; INCOME va sin cuenta (es del usuario).
 * Si recibe `transaction`, opera en modo edición.
 */
export function CreateTransactionDialog({ open, onOpenChange, type = 'EXPENSE', transaction }) {
  const movementType = transaction?.movement_type ?? type
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && (
          <TransactionForm
            transaction={transaction}
            movementType={movementType}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
