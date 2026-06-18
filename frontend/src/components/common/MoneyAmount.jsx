import { cn } from '@/lib/utils'
import { formatAmount, CURRENCY_META } from '@/lib/format'

/**
 * Monto en mono tabular — el rasgo característico de la app (PLAN §5.1).
 *
 * props:
 *  - value: número
 *  - currency: código (ARS, USD, ...) — muestra el símbolo
 *  - tone: 'neutral' | 'income' | 'expense'  (color del signo)
 *  - signed: anteponer +/− según el tono
 *  - size: 'sm' | 'md' | 'lg' | 'hero'
 */
const SIZES = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-2xl',
  hero: 'text-4xl md:text-5xl',
}

const TONES = {
  neutral: 'text-foreground',
  income: 'text-income-foreground',
  expense: 'text-expense-foreground',
}

export function MoneyAmount({
  value,
  currency,
  tone = 'neutral',
  signed = false,
  size = 'md',
  className,
}) {
  const symbol = currency ? CURRENCY_META[currency]?.symbol ?? currency : null
  const prefix = signed ? (tone === 'expense' ? '−' : tone === 'income' ? '+' : '') : ''

  return (
    <span
      className={cn(
        'tabular font-mono tracking-tight whitespace-nowrap',
        SIZES[size],
        TONES[tone],
        className,
      )}
    >
      {symbol && (
        <span className="mr-1 text-muted-foreground font-normal">{symbol}</span>
      )}
      {prefix}
      {formatAmount(value)}
    </span>
  )
}
