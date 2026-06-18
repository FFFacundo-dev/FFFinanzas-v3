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
import { AccountSelect, NONE } from '@/components/common/EntitySelects'
import { MoneyAmount } from '@/components/common/MoneyAmount'
import { toInputDate } from '@/lib/format'
import {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
} from '@/features/categories/categoriesApi'
import { useCreateTransactionMutation } from '@/features/transactions/transactionsApi'

const ADJUST_CATEGORY = 'Ajuste'

/** Busca la categoría "Ajuste" o la crea. Devuelve su id (o null si falla). */
async function ensureAdjustCategory(categories, createCategory) {
  const existing = categories.find(
    (c) => c.name.trim().toLowerCase() === ADJUST_CATEGORY.toLowerCase(),
  )
  if (existing) return existing.id
  try {
    const res = await createCategory({ name: ADJUST_CATEGORY }).unwrap()
    return res?.data?.id ?? res?.id ?? null
  } catch {
    return null
  }
}

function ReconcileForm({ currency, currentBalance, onClose }) {
  const { data: categories = [] } = useGetCategoriesQuery()
  const [createCategory] = useCreateCategoryMutation()
  const [createTx, { isLoading }] = useCreateTransactionMutation()

  const [real, setReal] = useState('')
  const [accountId, setAccountId] = useState(NONE)

  const realNum = Number(real)
  const hasReal = real !== '' && Number.isFinite(realNum)
  const diff = hasReal ? Number((realNum - currentBalance).toFixed(2)) : 0
  const isExpense = diff < 0

  async function handleSubmit(e) {
    e.preventDefault()
    if (!hasReal) {
      toast.error('Ingresá cuánto tenés realmente')
      return
    }
    if (diff === 0) {
      toast.info('El pozo ya coincide, no hace falta ajustar')
      onClose()
      return
    }
    if (isExpense && accountId === NONE) {
      toast.error('Elegí de qué medio sale el ajuste negativo')
      return
    }

    const categoryId = await ensureAdjustCategory(categories, createCategory)

    try {
      await createTx({
        movement_type: isExpense ? 'EXPENSE' : 'INCOME',
        amount: Math.abs(diff),
        currency_code: currency,
        category_id: categoryId,
        account_id: isExpense ? accountId : null,
        date: toInputDate(new Date()),
        description: `Ajuste de saldo (${currency})`,
      }).unwrap()
      toast.success('Pozo conciliado')
      onClose()
    } catch (err) {
      toast.error(err?.message ?? 'No se pudo conciliar')
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display">Conciliar {currency}</DialogTitle>
        <DialogDescription>
          Ingresá cuánto tenés realmente y se registra un ajuste por la diferencia.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex items-center justify-between rounded-sm border border-border bg-secondary/40 px-3 py-2 text-sm">
          <span className="text-muted-foreground">Pozo actual</span>
          <MoneyAmount value={currentBalance} currency={currency} size="sm" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rec-real">Monto real</Label>
          <Input
            id="rec-real"
            type="number"
            step="0.01"
            required
            value={real}
            onChange={(e) => setReal(e.target.value)}
            placeholder="0,00"
            className="font-mono tabular"
          />
        </div>

        {hasReal && diff !== 0 && (
          <div className="flex items-center justify-between rounded-sm border border-border px-3 py-2 text-sm">
            <span className="text-muted-foreground">
              Ajuste: {isExpense ? 'gasto' : 'ingreso'}
            </span>
            <MoneyAmount
              value={Math.abs(diff)}
              currency={currency}
              tone={isExpense ? 'expense' : 'income'}
              signed
              size="sm"
            />
          </div>
        )}

        {hasReal && isExpense && (
          <div className="flex flex-col gap-1.5">
            <Label>Medio del ajuste</Label>
            <AccountSelect value={accountId} onChange={setAccountId} />
          </div>
        )}

        <DialogFooter className="mt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Guardando…' : 'Conciliar'}
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}

export function ReconcileDialog({ open, onOpenChange, currency, currentBalance }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && currency && (
          <ReconcileForm
            currency={currency}
            currentBalance={currentBalance}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
