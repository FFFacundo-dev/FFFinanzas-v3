import { MoneyAmount } from '@/components/common/MoneyAmount'

const KIND_TONE = { base: 'neutral', add: 'income', sub: 'expense' }

/** Desglose del cálculo del restante para una moneda (contenido del tooltip). */
export function RemainingDetail({ currency, value, breakdown, note }) {
  return (
    <div className="min-w-52">
      <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {currency} · cómo se calcula
      </p>
      <dl className="space-y-1">
        {breakdown.map((b, i) => (
          <div key={i} className="flex items-baseline justify-between gap-6">
            <dt className="text-xs text-muted-foreground">{b.label}</dt>
            <dd>
              <MoneyAmount
                value={b.amount}
                currency={currency}
                size="sm"
                tone={KIND_TONE[b.kind]}
                signed={b.kind === 'add' || b.kind === 'sub' || b.amount < 0}
              />
            </dd>
          </div>
        ))}
      </dl>
      <div className="mt-2 flex items-baseline justify-between gap-6 border-t border-border pt-2">
        <span className="text-xs font-medium text-foreground">Restante</span>
        <MoneyAmount
          value={Math.abs(value)}
          currency={currency}
          size="sm"
          tone={value < 0 ? 'expense' : 'neutral'}
          signed={value < 0}
        />
      </div>
      {note && <p className="mt-2 text-[11px] text-muted-foreground">{note}</p>}
    </div>
  )
}
