import { CreditCard } from '@phosphor-icons/react'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'

export function InstallmentsView() {
  return (
    <>
      <PageHeader title="Cuotas" description="Compras en cuotas y su progreso." />
      <EmptyState
        icon={CreditCard}
        title="Las cuotas llegan en la fase 7"
        description="Alta de cuotas, pagos y adelantos (ya sin transferencias: el adelanto es solo un gasto mayor)."
      />
    </>
  )
}
