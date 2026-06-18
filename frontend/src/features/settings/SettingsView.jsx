import { Gear } from '@phosphor-icons/react'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'

export function SettingsView() {
  return (
    <>
      <PageHeader
        title="Ajustes"
        description="Apertura por moneda, medios, categorías y reconciliación."
      />
      <EmptyState
        icon={Gear}
        title="Los ajustes llegan en la fase 8"
        description="Saldo de apertura por moneda, gestión de medios y categorías, y el conteo/reconciliación del pozo."
      />
    </>
  )
}
