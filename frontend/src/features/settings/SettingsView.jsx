import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { FolderSimple, Wallet } from '@phosphor-icons/react'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { CategoryManagerDialog } from '@/features/categories/components/CategoryManagerDialog'
import { AccountManagerDialog } from '@/features/accounts/components/AccountManagerDialog'
import { OpeningBalancesCard } from './components/OpeningBalancesCard'
import { ReconcileCard } from './components/ReconcileCard'

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

  const [categoryOpen, setCategoryOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)

  return (
    <>
      <PageHeader
        title="Ajustes"
        description="Apertura por moneda, medios, categorías y reconciliación."
      />

      <div className="space-y-6">
        <OpeningBalancesCard />

        <ReconcileCard />

        {/* Gestión de categorías y medios */}
        <Card className="shadow-subtle">
          <CardHeader>
            <CardTitle className="font-display text-base font-normal">
              Categorías y medios
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Las etiquetas con las que clasificás tus movimientos.
            </p>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setCategoryOpen(true)}>
              <FolderSimple className="h-4 w-4" />
              Gestionar categorías
            </Button>
            <Button variant="outline" onClick={() => setAccountOpen(true)}>
              <Wallet className="h-4 w-4" />
              Gestionar medios
            </Button>
          </CardContent>
        </Card>

        {/* Dinero restante (barra superior) */}
        <Card className="shadow-subtle">
          <CardHeader>
            <CardTitle className="font-display text-base font-normal">Dinero restante</CardTitle>
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
      </div>

      <CategoryManagerDialog open={categoryOpen} onOpenChange={setCategoryOpen} />
      <AccountManagerDialog open={accountOpen} onOpenChange={setAccountOpen} />
    </>
  )
}
