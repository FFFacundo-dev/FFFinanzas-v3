import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, ArrowsClockwise, CurrencyDollarSimple, PencilSimple, Trash } from '@phosphor-icons/react'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { MoneyAmount } from '@/components/common/MoneyAmount'
import {
  useGetSubscriptionsQuery,
  useDeleteSubscriptionMutation,
} from './subscriptionsApi'
import { SubscriptionDialog } from './components/SubscriptionDialog'
import { PaySubscriptionDialog } from './components/PaySubscriptionDialog'

const STATUS_META = {
  ACTIVE: { label: 'Activa', cls: 'bg-income text-income-foreground' },
  PAUSED: { label: 'Pausada', cls: 'bg-secondary text-secondary-foreground' },
  CANCELLED: { label: 'Cancelada', cls: 'bg-expense text-expense-foreground' },
}

export function SubscriptionsView() {
  const { data: subs = [], isLoading } = useGetSubscriptionsQuery()
  const [deleteSub] = useDeleteSubscriptionMutation()

  const [dialog, setDialog] = useState({ open: false, subscription: null })
  const [payFor, setPayFor] = useState(null)
  const [toDelete, setToDelete] = useState(null)

  async function confirmDelete() {
    try {
      await deleteSub(toDelete.id).unwrap()
      toast.success('Suscripción eliminada')
    } catch (err) {
      toast.error(err?.message ?? 'No se pudo eliminar')
    } finally {
      setToDelete(null)
    }
  }

  return (
    <>
      <PageHeader
        title="Subs / Fijos"
        description="Suscripciones y gastos recurrentes."
        actions={
          <Button onClick={() => setDialog({ open: true, subscription: null })}>
            <Plus className="h-4 w-4" />
            Nueva
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : !subs.length ? (
        <EmptyState
          icon={ArrowsClockwise}
          title="Sin suscripciones"
          description="Cargá tus gastos fijos para no perderles el rastro."
          action={
            <Button onClick={() => setDialog({ open: true, subscription: null })}>
              <Plus className="h-4 w-4" />
              Nueva suscripción
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {subs.map((s) => {
            const status = STATUS_META[s.status] ?? STATUS_META.ACTIVE
            return (
              <Card key={s.id} className="shadow-subtle">
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-foreground">{s.name}</p>
                      <Badge className={`rounded-sm font-normal ${status.cls}`}>
                        {status.label}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {s.billing_day ? `Cobra el día ${s.billing_day}` : 'Sin día de cobro'}
                    </p>
                  </div>

                  {s.default_amount != null && (
                    <MoneyAmount value={s.default_amount} currency={s.currency_code} size="lg" />
                  )}

                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPayFor(s)}
                      disabled={s.default_amount == null}
                    >
                      <CurrencyDollarSimple className="h-4 w-4" />
                      Pagar
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      aria-label="Editar"
                      onClick={() => setDialog({ open: true, subscription: s })}
                    >
                      <PencilSimple className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      aria-label="Eliminar"
                      onClick={() => setToDelete(s)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <SubscriptionDialog
        open={dialog.open}
        subscription={dialog.subscription}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
      />
      <PaySubscriptionDialog
        open={Boolean(payFor)}
        subscription={payFor}
        onOpenChange={(o) => !o && setPayFor(null)}
      />
      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Eliminar suscripción"
        description={`Se eliminará "${toDelete?.name}". Los pagos ya registrados quedan como gastos.`}
        confirmLabel="Eliminar"
        onConfirm={confirmDelete}
      />
    </>
  )
}
