import { useState } from 'react'
import { Plus, PencilSimple, Trash, Check, X, Lock } from '@phosphor-icons/react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { EmptyState } from '@/components/common/EmptyState'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from '../categoriesApi'
import { runMutation } from '@/lib/mutation'

/** Manager de categorías (patrón v2: lista + alta + rename + delete). */
export function CategoryManagerDialog({ open, onOpenChange }) {
  const { data: categories = [], isLoading } = useGetCategoriesQuery(undefined, { skip: !open })
  const [createCategory, createState] = useCreateCategoryMutation()
  const [updateCategory] = useUpdateCategoryMutation()
  const [deleteCategory] = useDeleteCategoryMutation()

  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [toDelete, setToDelete] = useState(null)

  async function handleAdd(e) {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    const { ok } = await runMutation(createCategory({ name }), { success: 'Categoría creada', error: 'No se pudo crear' })
    if (!ok) return
    setNewName('')
  }

  async function handleRename(id) {
    const name = editingName.trim()
    if (!name) return
    const { ok } = await runMutation(updateCategory({ id, name }), { success: 'Categoría actualizada', error: 'No se pudo actualizar' })
    if (!ok) return
    setEditingId(null)
  }

  async function confirmDelete() {
    await runMutation(deleteCategory(toDelete.id), { success: 'Categoría eliminada', error: 'No se pudo eliminar' })
    setToDelete(null)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Categorías</DialogTitle>
            <DialogDescription>Organizá tus movimientos por categoría. Solo los ingresos con la categoría «Ingreso» cuentan en las estadísticas.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAdd} className="flex gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nueva categoría"
            />
            <Button type="submit" disabled={createState.isLoading || !newName.trim()}>
              <Plus className="h-4 w-4" />
              Agregar
            </Button>
          </form>

          <ScrollArea className="max-h-72">
            {isLoading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Cargando…</p>
            ) : !categories.length ? (
              <EmptyState title="Sin categorías" description="Creá la primera arriba." className="py-10" />
            ) : (
              <ul className="divide-y divide-border">
                {categories.map((c) => (
                  <li key={c.id} className="flex items-center gap-2 py-2">
                    {editingId === c.id ? (
                      <>
                        <Input
                          autoFocus
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); handleRename(c.id) }
                            if (e.key === 'Escape') setEditingId(null)
                          }}
                          className="h-8"
                        />
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleRename(c.id)}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 truncate text-sm">{c.name}</span>
                        {c.is_system ? (
                          <span
                            className="flex items-center gap-1 text-xs text-muted-foreground"
                            title="Solo los ingresos con esta categoría cuentan en las estadísticas"
                          >
                            <Lock className="h-3.5 w-3.5" />
                            Fija
                          </span>
                        ) : (
                        <>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground"
                          onClick={() => { setEditingId(c.id); setEditingName(c.name) }}
                        >
                          <PencilSimple className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setToDelete(c)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                        </>
                        )}
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Eliminar categoría"
        description={`Se quitará "${toDelete?.name}". Los movimientos quedan sin categoría.`}
        confirmLabel="Eliminar"
        onConfirm={confirmDelete}
      />
    </>
  )
}
