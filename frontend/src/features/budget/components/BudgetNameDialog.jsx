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
// withMonth: en "crear" se pide también el mes (input month nativo).
function NameForm({ initialName, initialMonth, withMonth, submitLabel, submitting, onSubmit, onClose }) {
  const [name, setName] = useState(initialName)
  const [month, setMonth] = useState(initialMonth) // 'YYYY-MM'
  const trimmed = name.trim()

  function handleSubmit(e) {
    e.preventDefault()
    if (trimmed) onSubmit(trimmed, withMonth && month ? `${month}-01` : undefined)
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
      {withMonth && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="budget-month">Mes</Label>
          <Input
            id="budget-month"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </div>
      )}
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting || !trimmed || (withMonth && !month)}>
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
  initialMonth = '',
  withMonth = false,
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
              initialMonth={initialMonth}
              withMonth={withMonth}
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
