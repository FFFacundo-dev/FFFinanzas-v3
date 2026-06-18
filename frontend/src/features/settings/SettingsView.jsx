import { useSelector, useDispatch } from 'react-redux'
import { Gear } from '@phosphor-icons/react'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useGetCurrenciesQuery } from '@/features/currencies/currenciesApi'
import {
  REMAINING_MODES,
  selectRemainingMode,
  selectRemainingCurrencies,
  setRemainingMode,
  toggleRemainingCurrency,
} from '@/features/ui/uiSlice'
import { CURRENCY_META } from '@/lib/format'

const MODE_OPTIONS = [
  { value: 'POZO', label: 'Pozo', hint: 'Saldo del pozo, tal cual' },
  { value: 'LIBRE', label: 'Libre', hint: 'Menos fijos y cuotas por pagar' },
  { value: 'PRESUPUESTO', label: 'Presupuesto', hint: 'Menos el presupuesto del mes' },
]

export function SettingsView() {
  const dispatch = useDispatch()
  const mode = useSelector(selectRemainingMode)
  const selected = useSelector(selectRemainingCurrencies)
  const { data: currencies = [] } = useGetCurrenciesQuery()

  return (
    <>
      <PageHeader
        title="Ajustes"
        description="Apertura por moneda, medios, categorías y reconciliación."
      />

      <div className="space-y-6">
        <Card className="shadow-subtle">
          <CardHeader>
            <CardTitle className="font-display text-base font-normal">
              Dinero restante
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Controlá la barra superior que ves en todo momento.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col gap-1.5">
              <Label>Cómo calcularlo por defecto</Label>
              <Select value={mode} onValueChange={(v) => dispatch(setRemainingMode(v))}>
                <SelectTrigger className="max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODE_OPTIONS.filter((o) => REMAINING_MODES.includes(o.value)).map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label} — <span className="text-muted-foreground">{o.hint}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Monedas que se muestran</Label>
              <p className="text-xs text-muted-foreground">
                Si no elegís ninguna, se muestran todas.
              </p>
              <ul className="mt-1 divide-y divide-border rounded-lg border border-border">
                {currencies.map((c) => {
                  const on = selected.includes(c.code)
                  return (
                    <li key={c.code} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <span className="text-sm text-foreground">{c.code}</span>{' '}
                        <span className="text-xs text-muted-foreground">
                          {CURRENCY_META[c.code]?.label ?? c.name}
                        </span>
                      </div>
                      <Switch
                        checked={on}
                        onCheckedChange={() => dispatch(toggleRemainingCurrency(c.code))}
                        aria-label={`Mostrar ${c.code}`}
                      />
                    </li>
                  )
                })}
              </ul>
            </div>
          </CardContent>
        </Card>

        <EmptyState
          icon={Gear}
          title="Apertura y reconciliación llegan en la fase 8"
          description="Saldo de apertura por moneda y el conteo/ajuste del pozo contra la realidad."
        />
      </div>
    </>
  )
}
