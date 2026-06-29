import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Diálogo de nombre reutilizable para crear/renombrar un presupuesto.
function NameForm({ initialName, submitLabel, submitting, onSubmit, onClose }) {
  const [name, setName] = useState(initialName)
  const trimmed = name.trim()

  function handleSubmit(e) {
    e.preventDefault()
    if (trimmed) onSubmit(trimmed)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="budget-name">Nombre</Label>
        <Input
          id="budget-name"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Junio ahorro"
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting || !trimmed}>
          {submitting ? 'Guardando…' : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function BudgetNameDialog({
  open,
  onOpenChange,
  title,
  initialName = '',
  submitLabel = 'Guardar',
  submitting = false,
  onSubmit,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        {open && (
          <>
            <DialogHeader>
              <DialogTitle className="font-display">{title}</DialogTitle>
            </DialogHeader>
            <NameForm
              initialName={initialName}
              submitLabel={submitLabel}
              submitting={submitting}
              onSubmit={onSubmit}
              onClose={() => onOpenChange(false)}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
