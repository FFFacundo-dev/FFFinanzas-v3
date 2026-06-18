import { ChartLineUp } from '@phosphor-icons/react'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'

export function DashboardView() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Tu fondo único por moneda, de un vistazo."
      />
      <EmptyState
        icon={ChartLineUp}
        title="El balance único llega en la fase 5"
        description="Acá va el saldo héroe por moneda, el cashflow mensual y el gasto por categoría y por medio."
      />
    </>
  )
}
