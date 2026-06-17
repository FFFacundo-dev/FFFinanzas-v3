import { HttpError } from './http-error.js'

// Helpers de dinero en centavos para las cuotas (evita drift de floats).
// La ultima cuota absorbe el redondeo. Portado de v2.

export function toMoneyCents(amount, fieldName = 'amount') {
  const numeric = Number(amount)
  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new HttpError(400, `${fieldName} must be a positive number`)
  }
  return Math.round(numeric * 100)
}

export function centsToMoney(cents) {
  return Number((Number(cents || 0) / 100).toFixed(2))
}

export function buildInstallmentDistributionCents(totalAmount, totalInstallments, defaultAmount) {
  const totalCents = toMoneyCents(totalAmount, 'total_amount')
  const count = Number(totalInstallments)
  if (!Number.isInteger(count) || count <= 0) {
    throw new HttpError(400, 'total_installments must be a positive integer')
  }

  const base = defaultAmount !== undefined && defaultAmount !== null
    ? toMoneyCents(defaultAmount, 'default_amount')
    : Math.round(totalCents / count)

  const values = []
  for (let index = 0; index < count; index += 1) {
    if (index === count - 1) {
      const sumBeforeLast = values.reduce((acc, item) => acc + item, 0)
      values.push(totalCents - sumBeforeLast)
    } else {
      values.push(base)
    }
  }
  return values
}

export function sumInstallmentRangeCents(distribution, startNumber, count) {
  const start = Number(startNumber)
  const rangeCount = Number(count)
  if (!Number.isInteger(start) || start <= 0) {
    throw new HttpError(400, 'start installment number must be a positive integer')
  }
  if (!Number.isInteger(rangeCount) || rangeCount <= 0) {
    throw new HttpError(400, 'installments_count must be a positive integer')
  }
  return distribution.slice(start - 1, start - 1 + rangeCount).reduce((acc, cents) => acc + cents, 0)
}

export function normalizeMonthStart(value, fieldName = 'period_month') {
  const raw = String(value || '').trim()
  const match = raw.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/)
  if (!match) {
    throw new HttpError(400, `${fieldName} must be in YYYY-MM or YYYY-MM-DD format`)
  }
  const month = Number(match[2])
  if (month < 1 || month > 12) {
    throw new HttpError(400, `${fieldName} is invalid`)
  }
  return `${match[1]}-${match[2]}-01`
}
