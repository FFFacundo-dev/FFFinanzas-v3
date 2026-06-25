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
import { MoneyInput } from '@/components/common/MoneyInput'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CurrencySelect, NONE } from '@/components/common/EntitySelects'
import { toInputDate } from '@/lib/format'
import { useCreateGoalMutation, useUpdateGoalMutation, useGetGoalsQuery } from '../goalsApi'

function initialForm(goal) {
  if (goal) {
    return {
      name: goal.name ?? '',
      target_amount: goal.target_amount != null ? String(goal.target_amount) : '',
      currency_code: goal.currency_code ?? 'ARS',
      deadline: goal.deadline ? toInputDate(goal.deadline) : '',
      parent_id: goal.parent_id ?? NONE,
    }
  }
  return { name: '', target_amount: '', currency_code: 'ARS', deadline: '', parent_id: NONE }
}

function GoalForm({ goal, onClose }) {
  const isEdit = Boolean(goal)
  const [createGoal, createState] = useCreateGoalMutation()
  const [updateGoal, updateState] = useUpdateGoalMutation()
  const { data: goals = [] } = useGetGoalsQuery()
  const saving = createState.isLoading || updateState.isLoading
  const [form, setForm] = useState(() => initialForm(goal))

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }))

  // Esta meta agrupa otras → no puede a su vez pertenecer a un grupo.
  const hasChildren = goals.some((g) => g.parent_id === goal?.id)
  // Candidatas a padre: misma moneda, activas, no anidadas y distintas de esta meta.
  const parentOptions = goals.filter(
    (g) =>
      g.id !== goal?.id &&
      g.parent_id == null &&
      g.status !== 'ARCHIVED' &&
      g.currency_code === form.currency_code,
  )

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }
    if (form.target_amount && !(Number(form.target_amount) > 0)) {
      toast.error('El objetivo debe ser mayor a cero')
      return
    }
    const targetAmount = form.target_amount ? Number(form.target_amount) : null
    const parentId = hasChildren || form.parent_id === NONE ? null : form.parent_id
    try {
      if (isEdit) {
        await updateGoal({
          id: goal.id,
          name: form.name.trim(),
          target_amount: targetAmount,
          deadline: form.deadline || null,
          parent_id: parentId,
        }).unwrap()
        toast.success('Meta actualizada')
      } else {
        await createGoal({
          name: form.name.trim(),
          target_amount: targetAmount,
          currency_code: form.currency_code,
          deadline: form.deadline || null,
          parent_id: parentId,
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
            <Label htmlFor="goal-target">Objetivo (opcional)</Label>
            <MoneyInput
              id="goal-target"
              value={form.target_amount}
              onChange={(v) => set('target_amount', v)}
              placeholder="Sin objetivo"
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
                onChange={(v) => setForm((f) => ({ ...f, currency_code: v, parent_id: NONE }))}
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

        <div className="flex flex-col gap-1.5">
          <Label>Grupo (opcional)</Label>
          {hasChildren ? (
            <p className="text-xs text-muted-foreground">
              Esta meta agrupa otras, no puede pertenecer a un grupo.
            </p>
          ) : (
            <Select
              value={form.parent_id}
              onValueChange={(v) => set('parent_id', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin grupo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Sin grupo</SelectItem>
                {parentOptions.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
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
