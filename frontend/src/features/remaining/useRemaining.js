import { useGetBalancesSummaryQuery } from '@/features/dashboard/dashboardApi'
import { useGetInstallmentProgressQuery } from '@/features/installments/installmentsApi'
import { useGetSubscriptionsQuery } from '@/features/subscriptions/subscriptionsApi'

/**
 * Calcula el "dinero restante" por moneda según el modo elegido, devolviendo el
 * valor final y el desglose del cálculo (para el detalle en hover).
 * Jerarquía TOTAL ≥ DISPONIBLE ≥ LIBRE:
 *  DISPONIBLE → total − reservado en metas
 *  LIBRE      → disponible − (cuotas por pagar + fijos activos mensuales)
 *  TOTAL      → saldo del pozo, tal cual
 *
 * Solo LIBRE necesita cuotas + subs; el resto sale del summary.
 */
export function useRemaining(mode) {
  const summaryQ = useGetBalancesSummaryQuery()
  const installmentsQ = useGetInstallmentProgressQuery(undefined, { skip: mode !== 'LIBRE' })
  const subsQ = useGetSubscriptionsQuery(undefined, { skip: mode !== 'LIBRE' })

  const summary = summaryQ.data ?? []

  function detailFor(row) {
    const total = Number(row.total_balance)
    const reserved = Number(row.reserved_balance)
    const code = row.currency_code
    const breakdown = [{ label: 'Saldo del pozo', amount: total, kind: 'base' }]

    if (mode === 'TOTAL') {
      return { value: total, breakdown, note: 'apertura + ingresos − gastos ± cambios' }
    }

    if (reserved > 0) {
      breakdown.push({ label: 'Reservado en metas', amount: reserved, kind: 'sub' })
    }

    if (mode === 'DISPONIBLE') {
      return { value: total - reserved, breakdown }
    }

    // LIBRE
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
    return { value: total - reserved - installments - subs, breakdown }
  }

  const rows = summary.map((row) => ({
    currency_code: row.currency_code,
    ...detailFor(row),
  }))

  const isLoading =
    summaryQ.isLoading || (mode === 'LIBRE' && (installmentsQ.isLoading || subsQ.isLoading))

  return { rows, isLoading }
}
