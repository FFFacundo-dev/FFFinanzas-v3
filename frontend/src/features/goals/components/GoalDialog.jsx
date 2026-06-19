import { useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CurrencySelect } from '@/components/common/EntitySelects'
import { toInputDate } from '@/lib/format'
import { useCreateGoalMutation, useUpdateGoalMutation } from '../goalsApi'

function initialForm(goal) {
  if (goal) {
    return {
      name: goal.name ?? '',
      target_amount: goal.target_amount != null ? String(goal.target_amount) : '',
      currency_code: goal.currency_code ?? 'ARS',
      deadline: goal.deadline ? toInputDate(goal.deadline) : '',
    }
  }
  return { name: '', target_amount: '', currency_code: 'ARS', deadline: '' }
}

function GoalForm({ goal, onClose }) {
  const isEdit = Boolean(goal)
  const [createGoal, createState] = useCreateGoalMutation()
  const [updateGoal, updateState] = useUpdateGoalMutation()
  const saving = createState.isLoading || updateState.isLoading
  const [form, setForm] = useState(() => initialForm(goal))

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }
    if (!(Number(form.target_amount) > 0)) {
      toast.error('El objetivo debe ser mayor a cero')
      return
    }
    try {
      if (isEdit) {
        await updateGoal({
          id: goal.id,
          name: form.name.trim(),
          target_amount: Number(form.target_amount),
          deadline: form.deadline || null,
        }).unwrap()
        toast.success('Meta actualizada')
      } else {
        await createGoal({
          name: form.name.trim(),
          target_amount: Number(form.target_amount),
          currency_code: form.currency_code,
          deadline: form.deadline || null,
        }).unwrap()
        toast.success('Meta creada')
      }
      onClose()
    } catch (err) {
      toast.error(err?.message ?? 'No se pudo guardar')
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display">
          {isEdit ? 'Editar meta' : 'Nueva meta'}
        </DialogTitle>
        <DialogDescription>
          Reservás parte del pozo de una moneda para un objetivo, sin gastarlo.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="goal-name">Nombre</Label>
          <Input
            id="goal-name"
            required
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Ej. Vacaciones"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="goal-target">Objetivo</Label>
            <Input
              id="goal-target"
              type="number"
              step="0.01"
              min="0"
              required
              value={form.target_amount}
              onChange={(e) => set('target_amount', e.target.value)}
              placeholder="0,00"
              className="font-mono tabular"
            />
          </div>
          <div className="flex w-28 flex-col gap-1.5">
            <Label>Moneda</Label>
            {isEdit ? (
              <Input value={form.currency_code} disabled className="font-mono tabular" />
            ) : (
              <CurrencySelect
                value={form.currency_code}
                onChange={(v) => set('currency_code', v)}
              />
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="goal-deadline">Fecha límite (opcional)</Label>
          <Input
            id="goal-deadline"
            type="date"
            value={form.deadline}
            onChange={(e) => set('deadline', e.target.value)}
            className="font-mono tabular"
          />
        </div>

        <DialogFooter className="mt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Guardando…' : isEdit ? 'Guardar' : 'Crear'}
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}

export function GoalDialog({ open, onOpenChange, goal }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && <GoalForm goal={goal} onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}
