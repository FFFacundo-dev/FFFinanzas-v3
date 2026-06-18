import { ArrowsClockwise } from '@phosphor-icons/react'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'

export function SubscriptionsView() {
  return (
    <>
      <PageHeader
        title="Subs / Fijos"
        description="Suscripciones y gastos recurrentes."
      />
      <EmptyState
        icon={ArrowsClockwise}
        title="Subs y fijos llegan en la fase 7"
        description="Cada pago genera un gasto con su moneda y su medio (etiqueta opcional)."
      />
    </>
  )
}
