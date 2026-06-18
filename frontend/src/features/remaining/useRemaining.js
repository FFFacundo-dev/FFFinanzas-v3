import { useGetBalanceByCurrencyQuery } from '@/features/dashboard/dashboardApi'
import { useGetBudgetSummaryQuery } from '@/features/budget/budgetApi'
import { useGetInstallmentProgressQuery } from '@/features/installments/installmentsApi'
import { useGetSubscriptionsQuery } from '@/features/subscriptions/subscriptionsApi'

function currentPeriod() {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-01`
}

/**
 * Calcula el "dinero restante" por moneda según el modo elegido, devolviendo
 * el valor final y el desglose del cálculo (para el detalle en hover).
 *  POZO        → saldo del pozo, tal cual
 *  LIBRE       → saldo − (cuotas por pagar + fijos activos mensuales)
 *  PRESUPUESTO → saldo + balance proyectado del mes (ingresos − gastos − fijos)
 *
 * Cada modo solo dispara los queries que necesita.
 */
export function useRemaining(mode) {
  const balanceQ = useGetBalanceByCurrencyQuery()
  const summaryQ = useGetBudgetSummaryQuery(currentPeriod(), { skip: mode !== 'PRESUPUESTO' })
  const installmentsQ = useGetInstallmentProgressQuery(undefined, { skip: mode !== 'LIBRE' })
  const subsQ = useGetSubscriptionsQuery(undefined, { skip: mode !== 'LIBRE' })

  const balances = balanceQ.data ?? []
  const base = new Map(balances.map((b) => [b.currency_code, Number(b.total_balance)]))

  function detailFor(code) {
    const balance = base.get(code) ?? 0
    const breakdown = [{ label: 'Saldo del pozo', amount: balance, kind: 'base' }]

    if (mode === 'POZO') {
      return {
        value: balance,
        breakdown,
        note: 'apertura + ingresos − gastos ± cambios',
      }
    }

    if (mode === 'LIBRE') {
      let installments = 0
      for (const i of installmentsQ.data ?? []) {
        if (i.currency_code === code && i.status === 'ACTIVE') {
          installments += Number(i.remaining) * Number(i.default_amount)
        }
      }
      let subs = 0
      for (const s of subsQ.data ?? []) {
        if (s.currency_code === code && s.status === 'ACTIVE' && s.default_amount != null) {
          subs += Number(s.default_amount)
        }
      }
      if (installments > 0) {
        breakdown.push({ label: 'Cuotas por pagar', amount: installments, kind: 'sub' })
      }
      if (subs > 0) {
        breakdown.push({ label: 'Fijos activos (mensual)', amount: subs, kind: 'sub' })
      }
      return { value: balance - installments - subs, breakdown }
    }

    // PRESUPUESTO
    const row = (summaryQ.data ?? []).find((r) => r.currency_code === code)
    const income = row ? Number(row.hypothetical_income_total) : 0
    const expense = row ? Number(row.hypothetical_expense_total) : 0
    const fixed = row ? Number(row.fixed_debt_total) : 0
    if (income > 0) breakdown.push({ label: 'Ingresos hipotéticos', amount: income, kind: 'add' })
    if (expense > 0) breakdown.push({ label: 'Gastos hipotéticos', amount: expense, kind: 'sub' })
    if (fixed > 0) breakdown.push({ label: 'Fijos del mes', amount: fixed, kind: 'sub' })
    return { value: balance + income - expense - fixed, breakdown }
  }

  const rows = balances.map((b) => ({
    currency_code: b.currency_code,
    ...detailFor(b.currency_code),
  }))

  const isLoading =
    balanceQ.isLoading ||
    (mode === 'PRESUPUESTO' && summaryQ.isLoading) ||
    (mode === 'LIBRE' && (installmentsQ.isLoading || subsQ.isLoading))

  return { rows, isLoading }
}
