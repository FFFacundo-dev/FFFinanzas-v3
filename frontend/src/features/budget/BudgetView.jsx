import { ChartPieSlice } from '@phosphor-icons/react'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'

export function BudgetView() {
  return (
    <>
      <PageHeader
        title="Presupuesto"
        description="Plan mensual de ingresos y gastos hipotéticos."
      />
      <EmptyState
        icon={ChartPieSlice}
        title="El presupuesto llega en la fase 7"
        description="Ítems de presupuesto, resumen y comparación contra lo real."
      />
    </>
  )
}
