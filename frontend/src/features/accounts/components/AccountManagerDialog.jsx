import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, PencilSimple, Trash, Check, X, Bank, DeviceMobile, Money } from '@phosphor-icons/react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EmptyState } from '@/components/common/EmptyState'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import {
  useGetAccountsQuery,
  useCreateAccountMutation,
  useUpdateAccountMutation,
  useDeleteAccountMutation,
} from '../accountsApi'

const TYPES = [
  { value: 'BANK', label: 'Banco', icon: Bank },
  { value: 'DIGITAL', label: 'Digital', icon: DeviceMobile },
  { value: 'CASH', label: 'Efectivo', icon: Money },
]
const TYPE_META = Object.fromEntries(TYPES.map((t) => [t.value, t]))

/** Manager de medios/cuentas (etiquetas, sin saldo). Patrón v2 manager. */
export function AccountManagerDialog({ open, onOpenChange }) {
  const { data: accounts = [], isLoading } = useGetAccountsQuery(undefined, { skip: !open })
  const [createAccount, createState] = useCreateAccountMutation()
  const [updateAccount] = useUpdateAccountMutation()
  const [deleteAccount] = useDeleteAccountMutation()

  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('BANK')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editType, setEditType] = useState('BANK')
  const [toDelete, setToDelete] = useState(null)

  async function handleAdd(e) {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    try {
      await createAccount({ name, account_type: newType }).unwrap()
      setNewName('')
      setNewType('BANK')
      toast.success('Medio creado')
    } catch (err) {
      toast.error(err?.message ?? 'No se pudo crear')
    }
  }

  function startEdit(a) {
    setEditingId(a.id)
    setEditName(a.name)
    setEditType(a.account_type)
  }

  async function handleSave(id) {
    const name = editName.trim()
    if (!name) return
    try {
      await updateAccount({ id, name, account_type: editType }).unwrap()
      setEditingId(null)
      toast.success('Medio actualizado')
    } catch (err) {
      toast.error(err?.message ?? 'No se pudo actualizar')
    }
  }

  async function confirmDelete() {
    try {
      await deleteAccount(toDelete.id).unwrap()
      toast.success('Medio eliminado')
    } catch (err) {
      toast.error(err?.message ?? 'No se pudo eliminar')
    } finally {
      setToDelete(null)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Medios / cuentas</DialogTitle>
            <DialogDescription>
              Etiquetas de gasto, sin saldo ni moneda propia.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAdd} className="flex gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nuevo medio"
              className="flex-1"
            />
            <Select value={newType} onValueChange={setNewType}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit" size="icon" disabled={createState.isLoading || !newName.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </form>

          <ScrollArea className="max-h-72">
            {isLoading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Cargando…</p>
            ) : !accounts.length ? (
              <EmptyState title="Sin medios" description="Creá el primero arriba." className="py-10" />
            ) : (
              <ul className="divide-y divide-border">
                {accounts.map((a) => {
                  const meta = TYPE_META[a.account_type]
                  const Icon = meta?.icon ?? Money
                  return (
                    <li key={a.id} className="flex items-center gap-2 py-2">
                      {editingId === a.id ? (
                        <>
                          <Input
                            autoFocus
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="h-8 flex-1"
                          />
                          <Select value={editType} onValueChange={setEditType}>
                            <SelectTrigger className="h-8 w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TYPES.map((t) => (
                                <SelectItem key={t.value} value={t.value}>
                                  {t.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleSave(a.id)}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="flex-1 truncate text-sm">{a.name}</span>
                          <Badge variant="secondary" className="rounded-sm font-normal">
                            {meta?.label ?? a.account_type}
                          </Badge>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground"
                            onClick={() => startEdit(a)}
                          >
                            <PencilSimple className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => setToDelete(a)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Eliminar medio"
        description={`Se quitará "${toDelete?.name}". Los gastos asociados quedan sin medio.`}
        confirmLabel="Eliminar"
        onConfirm={confirmDelete}
      />
    </>
  )
}
