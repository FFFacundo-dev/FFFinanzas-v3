import { useState } from 'react'
import { toast } from 'sonner'
import { ArrowDown, ArrowUp, ArrowsClockwise, FolderSimple, Wallet } from '@phosphor-icons/react'
import { PageHeader } from '@/components/common/PageHeader'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useGetTransactionsQuery, useDeleteTransactionMutation } from './transactionsApi'
import { useGetExchangesQuery, useDeleteExchangeMutation } from '@/features/exchanges/exchangesApi'
import { CreateTransactionDialog } from './components/CreateTransactionDialog'
import { TransactionsList } from './components/TransactionsList'
import { CategoryManagerDialog } from '@/features/categories/components/CategoryManagerDialog'
import { AccountManagerDialog } from '@/features/accounts/components/AccountManagerDialog'
import { CreateExchangeDialog } from '@/features/exchanges/components/CreateExchangeDialog'
import { ExchangesList } from '@/features/exchanges/components/ExchangesList'
import { GoalActivityTable } from '@/features/goals/components/GoalActivityTable'

export function TransactionsView() {
  const [filter, setFilter] = useState('ALL')
  const txQuery = useGetTransactionsQuery({
    limit: 100,
    ...(filter === 'ALL' ? {} : { movement_type: filter }),
  })
  const exQuery = useGetExchangesQuery()

  const [deleteTx] = useDeleteTransactionMutation()
  const [deleteExchange] = useDeleteExchangeMutation()

  // Dialogs
  const [txDialog, setTxDialog] = useState({ open: false, type: 'EXPENSE', transaction: null })
  const [exchangeOpen, setExchangeOpen] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [txToDelete, setTxToDelete] = useState(null)
  const [exToDelete, setExToDelete] = useState(null)

  function openCreate(type) {
    setTxDialog({ open: true, type, transaction: null })
  }
  function openEdit(transaction) {
    setTxDialog({ open: true, type: transaction.movement_type, transaction })
  }

  async function confirmDeleteTx() {
    try {
      await deleteTx(txToDelete.id).unwrap()
      toast.success('Movimiento eliminado')
    } catch (err) {
      toast.error(err?.message ?? 'No se pudo eliminar')
    } finally {
      setTxToDelete(null)
    }
  }

  async function confirmDeleteEx() {
    try {
      await deleteExchange(exToDelete.id).unwrap()
      toast.success('Cambio eliminado')
    } catch (err) {
      toast.error(err?.message ?? 'No se pudo eliminar')
    } finally {
      setExToDelete(null)
    }
  }

  return (
    <>
      <PageHeader
        title="Movimientos"
        description="Ingresos, gastos y cambios de moneda."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => openCreate('INCOME')}
              className="bg-income text-income-foreground hover:bg-income/80"
            >
              <ArrowDown className="h-4 w-4" weight="bold" />
              Ingreso
            </Button>
            <Button
              variant="secondary"
              onClick={() => openCreate('EXPENSE')}
              className="bg-expense text-expense-foreground hover:bg-expense/80"
            >
              <ArrowUp className="h-4 w-4" weight="bold" />
              Gasto
            </Button>
            <Button variant="outline" onClick={() => setExchangeOpen(true)}>
              <ArrowsClockwise className="h-4 w-4" />
              Cambio
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Gestionar">
                  <FolderSimple className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setCategoryOpen(true)}>
                  <FolderSimple className="h-4 w-4" />
                  Categorías
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setAccountOpen(true)}>
                  <Wallet className="h-4 w-4" />
                  Medios / cuentas
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      <Tabs defaultValue="movimientos">
        <TabsList>
          <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
          <TabsTrigger value="cambios">Cambios</TabsTrigger>
          <TabsTrigger value="metas">Metas</TabsTrigger>
        </TabsList>

        <TabsContent value="movimientos">
          <Card className="shadow-subtle">
            <CardContent className="pt-6">
              <div className="mb-2 flex justify-end">
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos</SelectItem>
                    <SelectItem value="INCOME">Ingresos</SelectItem>
                    <SelectItem value="EXPENSE">Gastos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <TransactionsList
                items={txQuery.data?.items}
                isLoading={txQuery.isLoading}
                onEdit={openEdit}
                onDelete={setTxToDelete}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cambios">
          <Card className="shadow-subtle">
            <CardContent className="pt-6">
              <ExchangesList
                items={exQuery.data}
                isLoading={exQuery.isLoading}
                onDelete={setExToDelete}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metas">
          <Card className="shadow-subtle">
            <CardContent className="pt-6">
              <p className="mb-3 text-sm text-muted-foreground">
                Plata que sale hacia metas (aporte) o vuelve al disponible (retiro).
              </p>
              <GoalActivityTable
                invert
                title={null}
                emptyMessage="Todavía no hay aportes ni retiros a metas."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CreateTransactionDialog
        open={txDialog.open}
        type={txDialog.type}
        transaction={txDialog.transaction}
        onOpenChange={(open) => setTxDialog((d) => ({ ...d, open }))}
      />
      <CreateExchangeDialog open={exchangeOpen} onOpenChange={setExchangeOpen} />
      <CategoryManagerDialog open={categoryOpen} onOpenChange={setCategoryOpen} />
      <AccountManagerDialog open={accountOpen} onOpenChange={setAccountOpen} />

      <ConfirmDialog
        open={Boolean(txToDelete)}
        onOpenChange={(o) => !o && setTxToDelete(null)}
        title="Eliminar movimiento"
        description={`Se eliminará "${txToDelete?.description ?? ''}". El pozo se recalcula.`}
        confirmLabel="Eliminar"
        onConfirm={confirmDeleteTx}
      />
      <ConfirmDialog
        open={Boolean(exToDelete)}
        onOpenChange={(o) => !o && setExToDelete(null)}
        title="Eliminar cambio"
        description="Se eliminará el cambio de moneda. Los pozos se recalculan."
        confirmLabel="Eliminar"
        onConfirm={confirmDeleteEx}
      />
    </>
  )
}
