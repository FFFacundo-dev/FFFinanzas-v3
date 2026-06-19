import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { MoneyAmount } from '@/components/common/MoneyAmount'
import { CURRENCY_META } from '@/lib/format'

/**
 * Saldo por moneda — el héroe del dashboard (PLAN §5.1 / §5.3), bifurcado:
 * destaca el **Disponible** (total − reservado en metas) y muestra el **Total**
 * atenuado cuando hay algo reservado. Un pozo por moneda; mono tabular.
 *
 * `balances`: filas de v_user_balances_summary
 *   { currency_code, total_balance, reserved_balance, available_balance }
 */
export function BalanceHero({ balances, isLoading }) {
  return (
    <Card className="border-border bg-card p-6 shadow-subtle md:p-8">
      <p className="font-display text-xs uppercase tracking-[0.18em] text-muted-foreground">
        Saldo disponible
      </p>

      {isLoading ? (
        <div className="mt-5 flex flex-wrap gap-x-12 gap-y-6">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-12 w-40" />
        </div>
      ) : !balances?.length ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Todavía no hay saldo. Cargá una apertura por moneda en Ajustes o registrá un
          movimiento.
        </p>
      ) : (
        <div className="mt-5 flex flex-wrap gap-x-12 gap-y-6">
          {balances.map((b) => {
            const available = Number(b.available_balance)
            const total = Number(b.total_balance)
            const reserved = Number(b.reserved_balance)
            const negative = available < 0
            return (
              <div key={b.currency_code} className="min-w-0">
                <div className="mb-1 flex items-baseline gap-2">
                  <span className="font-display text-sm text-foreground">
                    {b.currency_code}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {CURRENCY_META[b.currency_code]?.label ?? ''}
                  </span>
                </div>
                <MoneyAmount
                  value={Math.abs(available)}
                  currency={b.currency_code}
                  size="hero"
                  tone={negative ? 'expense' : 'neutral'}
                  signed={negative}
                />
                {reserved > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Total <MoneyAmount value={total} currency={b.currency_code} size="sm" /> ·
                    reservado{' '}
                    <MoneyAmount value={reserved} currency={b.currency_code} size="sm" />
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
