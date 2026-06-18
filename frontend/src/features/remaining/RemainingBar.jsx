import { useSelector, useDispatch } from 'react-redux'
import { CaretDown, Wallet } from '@phosphor-icons/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { MoneyAmount } from '@/components/common/MoneyAmount'
import {
  selectRemainingMode,
  selectRemainingCurrencies,
  setRemainingMode,
} from '@/features/ui/uiSlice'
import { useRemaining } from './useRemaining'
import { RemainingDetail } from './RemainingDetail'

const MODE_LABEL = {
  POZO: 'Pozo',
  LIBRE: 'Libre',
  PRESUPUESTO: 'Presupuesto',
}

const MODE_HINT = {
  POZO: 'Saldo del pozo',
  LIBRE: 'Menos lo comprometido',
  PRESUPUESTO: 'Menos el presupuesto del mes',
}

/** Barra superior persistente con el "dinero restante" por moneda. */
export function RemainingBar() {
  const dispatch = useDispatch()
  const mode = useSelector(selectRemainingMode)
  const selected = useSelector(selectRemainingCurrencies)
  const { rows, isLoading } = useRemaining(mode)

  const shown = selected.length
    ? rows.filter((r) => selected.includes(r.currency_code))
    : rows

  return (
    <div className="flex min-w-0 items-center gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger className="flex shrink-0 items-center gap-1.5 rounded-sm px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus:outline-none">
          <Wallet className="h-4 w-4" />
          <span className="font-medium uppercase tracking-wide">Restante</span>
          <span className="rounded-sm bg-secondary px-1.5 py-0.5 text-[11px] text-foreground">
            {MODE_LABEL[mode]}
          </span>
          <CaretDown className="h-3 w-3" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel className="font-normal text-muted-foreground">
            Cómo calcular el restante
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={mode}
            onValueChange={(v) => dispatch(setRemainingMode(v))}
          >
            {Object.keys(MODE_LABEL).map((m) => (
              <DropdownMenuRadioItem key={m} value={m} className="flex-col items-start gap-0">
                <span>{MODE_LABEL[m]}</span>
                <span className="text-[11px] text-muted-foreground">{MODE_HINT[m]}</span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <TooltipProvider delayDuration={120}>
        <div className="flex min-w-0 items-center gap-4 overflow-x-auto">
          {isLoading ? (
            <Skeleton className="h-5 w-32" />
          ) : !shown.length ? (
            <span className="text-xs text-muted-foreground">Sin datos</span>
          ) : (
            shown.map((r) => {
              const negative = r.value < 0
              return (
                <Tooltip key={r.currency_code}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="flex shrink-0 cursor-help items-baseline gap-1.5 rounded-sm px-1 py-0.5 transition-colors hover:bg-accent focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <span className="text-[11px] font-medium text-muted-foreground">
                        {r.currency_code}
                      </span>
                      <MoneyAmount
                        value={Math.abs(r.value)}
                        size="sm"
                        tone={negative ? 'expense' : 'neutral'}
                        signed={negative}
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    align="end"
                    className="border border-border bg-popover p-3 text-popover-foreground shadow-md"
                  >
                    <RemainingDetail
                      currency={r.currency_code}
                      value={r.value}
                      breakdown={r.breakdown}
                      note={r.note}
                    />
                  </TooltipContent>
                </Tooltip>
              )
            })
          )}
        </div>
      </TooltipProvider>
    </div>
  )
}
