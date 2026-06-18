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
 * Calcula el "dinero restante" por moneda según el modo elegido.
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

  function valueFor(code) {
    const balance = base.get(code) ?? 0
    if (mode === 'POZO') return balance

    if (mode === 'LIBRE') {
      let committed = 0
      for (const i of installmentsQ.data ?? []) {
        if (i.currency_code === code && i.status === 'ACTIVE') {
          committed += Number(i.remaining) * Number(i.default_amount)
        }
      }
      for (const s of subsQ.data ?? []) {
        if (s.currency_code === code && s.status === 'ACTIVE' && s.default_amount != null) {
          committed += Number(s.default_amount)
        }
      }
      return balance - committed
    }

    // PRESUPUESTO
    const row = (summaryQ.data ?? []).find((r) => r.currency_code === code)
    if (!row) return balance
    const projectedNet =
      Number(row.hypothetical_income_total) -
      Number(row.hypothetical_expense_total) -
      Number(row.fixed_debt_total)
    return balance + projectedNet
  }

  const rows = balances.map((b) => ({
    currency_code: b.currency_code,
    value: valueFor(b.currency_code),
  }))

  const isLoading =
    balanceQ.isLoading ||
    (mode === 'PRESUPUESTO' && summaryQ.isLoading) ||
    (mode === 'LIBRE' && (installmentsQ.isLoading || subsQ.isLoading))

  return { rows, isLoading }
}
