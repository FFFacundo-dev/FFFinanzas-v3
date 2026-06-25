import { useState } from 'react'
import { toast } from 'sonner'
import { ArrowRight } from '@phosphor-icons/react'
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
import { toInputDate, formatAmount } from '@/lib/format'
import { useGetCurrenciesQuery } from '@/features/currencies/currenciesApi'
import { useCreateExchangeMutation } from '../exchangesApi'

function initialForm() {
  return {
    from_currency_code: 'ARS',
    to_currency_code: 'USD',
    from_amount: '',
    to_amount: '',
    date: toInputDate(new Date()),
    description: '',
  }
}

/** Form interno: se monta fresco en cada apertura (sin useEffect de reset). */
function ExchangeForm({ onClose }) {
  const { data: currencies = [] } = useGetCurrenciesQuery()
  const [createExchange, { isLoading }] = useCreateExchangeMutation()
  const [form, setForm] = useState(initialForm)

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  const fromAmount = Number(form.from_amount)
  const toAmount = Number(form.to_amount)
  const rate = fromAmount > 0 && toAmount > 0 ? (toAmount / fromAmount).toFixed(4) : null

  async function handleSubmit(e) {
    e.preventDefault()
    if (!(fromAmount > 0) || !(toAmount > 0)) {
      toast.error('Ambos montos deben ser mayores a cero')
      return
    }
    if (form.from_currency_code === form.to_currency_code) {
      toast.error('Las monedas deben ser distintas')
      return
    }
    try {
      await createExchange({
        from_currency_code: form.from_currency_code,
        to_currency_code: form.to_currency_code,
        from_amount: fromAmount,
        to_amount: toAmount,
        date: form.date,
        description: form.description.trim() || null,
      }).unwrap()
      toast.success('Cambio registrado')
      onClose()
    } catch (err) {
      toast.error(err?.message ?? 'No se pudo registrar el cambio')
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display">Cambio de moneda</DialogTitle>
        <DialogDescription>
          Mueve valor entre pozos de distinta moneda. Es lo único entre monedas.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Entregás</Label>
            <MoneyInput
              required
              value={form.from_amount}
              onChange={(v) => set('from_amount', v)}
              placeholder="0,00"
              className="font-mono tabular"
            />
            <Select
              value={form.from_currency_code}
              onValueChange={(v) => set('from_currency_code', v)}
            >
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

          <ArrowRight className="mb-2 h-5 w-5 text-muted-foreground" />

          <div className="flex flex-col gap-1.5">
            <Label>Recibís</Label>
            <MoneyInput
              required
              value={form.to_amount}
              onChange={(v) => set('to_amount', v)}
              placeholder="0,00"
              className="font-mono tabular"
            />
            <Select
              value={form.to_currency_code}
              onValueChange={(v) => set('to_currency_code', v)}
            >
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

        <div className="rounded-sm border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
          {rate ? (
            <>
              Tipo de cambio:{' '}
              <span className="font-mono tabular text-foreground">
                1 {form.from_currency_code} = {formatAmount(rate)} {form.to_currency_code}
              </span>
            </>
          ) : (
            'Ingresá ambos montos para ver el tipo de cambio.'
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ex-date">Fecha</Label>
          <Input
            id="ex-date"
            type="date"
            required
            value={form.date}
            onChange={(e) => set('date', e.target.value)}
            className="font-mono tabular"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ex-desc">Descripción (opcional)</Label>
          <Input
            id="ex-desc"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Ej. compra de dólares"
          />
        </div>

        <DialogFooter className="mt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Guardando…' : 'Registrar cambio'}
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}

/** Cambio de moneda a nivel usuario (PLAN §3.5 / §5.3). No hay transferencias. */
export function CreateExchangeDialog({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && <ExchangeForm onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}
