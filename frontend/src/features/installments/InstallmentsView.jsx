import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, CreditCard, CurrencyDollarSimple, Trash } from '@phosphor-icons/react'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { MoneyAmount } from '@/components/common/MoneyAmount'
import {
  useGetInstallmentProgressQuery,
  useDeleteInstallmentMutation,
} from './installmentsApi'
import { CreateInstallmentDialog } from './components/CreateInstallmentDialog'
import { PayInstallmentDialog } from './components/PayInstallmentDialog'

function InstallmentCard({ item, onPay, onDelete }) {
  const total = Number(item.total_installments)
  const paid = Number(item.total_paid)
  const remaining = Number(item.remaining)
  const pct = total > 0 ? Math.round((paid / total) * 100) : 0
  const perInstallment = Number(item.default_amount)
  const remainingMoney = remaining * perInstallment
  const done = remaining <= 0
  const pendingThisMonth = Number(item.monthly_pending_count) > 0

  return (
    <Card className="shadow-subtle">
      <CardContent className="py-4">
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate font-medium text-foreground">{item.description}</p>
              {done ? (
                <Badge className="rounded-sm bg-income font-normal text-income-foreground">
                  Pagada
                </Badge>
              ) : pendingThisMonth ? (
                <Badge className="rounded-sm bg-expense font-normal text-expense-foreground">
                  Vence este mes
                </Badge>
              ) : null}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {paid} de {total} cuotas ·{' '}
              <span className="font-mono tabular">
                <MoneyAmount value={perInstallment} currency={item.currency_code} size="sm" />
              </span>{' '}
              c/u
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {!done && (
              <Button variant="outline" size="sm" onClick={() => onPay(item)}>
                <CurrencyDollarSimple className="h-4 w-4" />
                Pagar cuota
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              aria-label="Eliminar"
              onClick={() => onDelete(item)}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-sm bg-secondary">
            <div className="h-full rounded-sm bg-primary" style={{ width: `${pct}%` }} />
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">
            {done ? (
              'Completada'
            ) : (
              <>
                Resta{' '}
                <MoneyAmount value={remainingMoney} currency={item.currency_code} size="sm" />
              </>
            )}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function Section({ title, count, children }) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 font-display text-lg text-foreground">
        {title}
        <span className="rounded-sm bg-secondary px-1.5 py-0.5 text-xs font-sans text-muted-foreground">
          {count}
        </span>
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

export function InstallmentsView() {
  const { data: items = [], isLoading } = useGetInstallmentProgressQuery()
  const [deleteInstallment] = useDeleteInstallmentMutation()

  const [createOpen, setCreateOpen] = useState(false)
  const [payFor, setPayFor] = useState(null)
  const [toDelete, setToDelete] = useState(null)

  const pending = items.filter((i) => Number(i.remaining) > 0)
  const completed = items.filter((i) => Number(i.remaining) <= 0)

  async function confirmDelete() {
    try {
      await deleteInstallment(toDelete.installment_id).unwrap()
      toast.success('Cuota eliminada')
    } catch (err) {
      toast.error(err?.message ?? 'No se pudo eliminar')
    } finally {
      setToDelete(null)
    }
  }

  return (
    <>
      <PageHeader
        title="Cuotas"
        description="Compras en cuotas y su progreso."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Nueva
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : !items.length ? (
        <EmptyState
          icon={CreditCard}
          title="Sin cuotas"
          description="Cargá una compra en cuotas para seguir su progreso."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Nueva compra en cuotas
            </Button>
          }
        />
      ) : (
        <div className="space-y-8">
          {pending.length > 0 && (
            <Section title="Pendientes" count={pending.length}>
              {pending.map((i) => (
                <InstallmentCard
                  key={i.installment_id}
                  item={i}
                  onPay={setPayFor}
                  onDelete={setToDelete}
                />
              ))}
            </Section>
          )}

          {completed.length > 0 && (
            <Section title="Completadas" count={completed.length}>
              {completed.map((i) => (
                <InstallmentCard
                  key={i.installment_id}
                  item={i}
                  onPay={setPayFor}
                  onDelete={setToDelete}
                />
              ))}
            </Section>
          )}
        </div>
      )}

      <CreateInstallmentDialog open={createOpen} onOpenChange={setCreateOpen} />
      <PayInstallmentDialog
        open={Boolean(payFor)}
        installment={payFor}
        onOpenChange={(o) => !o && setPayFor(null)}
      />
      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Eliminar cuota"
        description={`Se eliminará "${toDelete?.description}". Los pagos ya hechos quedan como gastos.`}
        confirmLabel="Eliminar"
        onConfirm={confirmDelete}
      />
    </>
  )
}
