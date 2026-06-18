// Formato de montos y fechas (es-AR). Los montos se renderizan en mono tabular.

const LOCALE = 'es-AR'

export const CURRENCY_META = {
  ARS: { symbol: '$', label: 'Pesos' },
  USD: { symbol: 'US$', label: 'Dólares' },
  EUR: { symbol: '€', label: 'Euros' },
  BRL: { symbol: 'R$', label: 'Reales' },
  UYU: { symbol: '$U', label: 'Pesos uruguayos' },
}

const amountFormatter = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Solo el número, agrupado: 1.284.300,00 (sin signo ni símbolo). */
export function formatAmount(value) {
  const n = Number(value)
  return amountFormatter.format(Number.isFinite(n) ? n : 0)
}

/** Monto con símbolo de moneda: "US$ 2.140,00". */
export function formatCurrency(value, currencyCode) {
  const meta = CURRENCY_META[currencyCode]
  const symbol = meta ? meta.symbol : currencyCode
  return `${symbol} ${formatAmount(value)}`
}

/**
 * Parsea una fecha 'YYYY-MM-DD' como fecha LOCAL (sin corrimiento de zona).
 * Es el fix de v2: `new Date('2026-06-18')` se interpreta como UTC y puede
 * mostrar el día anterior; acá construimos la fecha desde sus partes.
 */
export function parseDate(value) {
  if (value instanceof Date) return value
  if (typeof value === 'string') {
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  }
  return new Date(value)
}

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

/** "18 jun 2026" */
export function formatDate(value) {
  return dateFormatter.format(parseDate(value))
}

/** 'YYYY-MM-DD' para inputs de tipo date. */
export function toInputDate(value) {
  const d = parseDate(value)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}
