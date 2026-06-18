import { Receipt } from '@phosphor-icons/react'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'

export function TransactionsView() {
  return (
    <>
      <PageHeader
        title="Movimientos"
        description="Ingresos, gastos y cambios de moneda."
      />
      <EmptyState
        icon={Receipt}
        title="Los movimientos llegan en la fase 6"
        description="Botones de Ingreso y Gasto, cambios de moneda y los managers de categorías y medios."
      />
    </>
  )
}
