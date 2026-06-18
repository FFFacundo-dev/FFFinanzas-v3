import { useState } from 'react'
import { toast } from 'sonner'
import { Check } from '@phosphor-icons/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { CURRENCY_META } from '@/lib/format'
import { useGetCurrenciesQuery } from '@/features/currencies/currenciesApi'
import {
  useGetOpeningBalancesQuery,
  useUpsertOpeningBalanceMutation,
} from '../openingBalancesApi'

function Row({ code, label, savedAmount }) {
  const [upsert, { isLoading }] = useUpsertOpeningBalanceMutation()
  const [value, setValue] = useState(savedAmount != null ? String(savedAmount) : '')
  const dirty = value !== (savedAmount != null ? String(savedAmount) : '')

  async function save() {
    const amount = Number(value)
    if (!Number.isFinite(amount)) {
      toast.error('Ingresá un número válido')
      return
    }
    try {
      await upsert({ currency_code: code, amount }).unwrap()
      toast.success(`Apertura de ${code} guardada`)
    } catch (err) {
      toast.error(err?.message ?? 'No se pudo guardar')
    }
  }

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <div className="w-28 shrink-0">
        <span className="text-sm text-foreground">{code}</span>{' '}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <Input
        type="number"
        step="0.01"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="0,00"
        className="flex-1 font-mono tabular"
      />
      <Button
        size="icon"
        variant={dirty ? 'default' : 'ghost'}
        className="h-9 w-9 shrink-0"
        onClick={save}
        disabled={!dirty || isLoading}
        aria-label="Guardar"
      >
        <Check className="h-4 w-4" />
      </Button>
    </li>
  )
}

/** Saldo de apertura del pozo por moneda (PLAN §3.3). */
export function OpeningBalancesCard() {
  const { data: currencies = [], isLoading: loadingCur } = useGetCurrenciesQuery()
  const { data: openings = [], isLoading: loadingOpen } = useGetOpeningBalancesQuery()
  const byCode = new Map(openings.map((o) => [o.currency_code, Number(o.amount)]))

  return (
    <Card className="shadow-subtle">
      <CardHeader>
        <CardTitle className="font-display text-base font-normal">Apertura por moneda</CardTitle>
        <p className="text-sm text-muted-foreground">
          La plata inicial de cada pozo, antes de los movimientos.
        </p>
      </CardHeader>
      <CardContent>
        {loadingCur || loadingOpen ? (
          <Skeleton className="h-40 w-full rounded-lg" />
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {currencies.map((c) => (
              <Row
                key={c.code}
                code={c.code}
                label={CURRENCY_META[c.code]?.label ?? c.name}
                savedAmount={byCode.get(c.code)}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
