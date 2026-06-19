import {
  Plus,
  Minus,
  DotsThree,
  PencilSimple,
  Archive,
  ArrowCounterClockwise,
  Trash,
} from '@phosphor-icons/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoneyAmount } from '@/components/common/MoneyAmount'
import { parseDate } from '@/lib/format'

function daysLeftLabel(deadline) {
  if (!deadline) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = parseDate(deadline)
  const diff = Math.round((d - today) / 86400000)
  if (diff < 0) return 'Vencida'
  if (diff === 0) return 'Vence hoy'
  if (diff === 1) return 'Falta 1 día'
  return `Faltan ${diff} días`
}

export function GoalCard({ goal, onAllocate, onRelease, onEdit, onArchiveToggle, onDelete }) {
  const current = Number(goal.current_amount)
  const target = Number(goal.target_amount)
  const pct = target > 0 ? (current / target) * 100 : 0
  const archived = goal.status === 'ARCHIVED'
  const days = daysLeftLabel(goal.deadline)

  return (
    <Card className="flex flex-col shadow-subtle">
      <CardContent className="flex flex-1 flex-col py-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{goal.name}</p>
            <p className="text-xs text-muted-foreground">{goal.currency_code}</p>
          </div>
          <div className="flex items-center gap-1">
            {goal.is_completed && (
              <Badge className="rounded-sm bg-income font-normal text-income-foreground">
                Completada
              </Badge>
            )}
            {archived && (
              <Badge variant="secondary" className="rounded-sm font-normal">
                Archivada
              </Badge>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" aria-label="Más">
                  <DotsThree className="h-5 w-5" weight="bold" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(goal)}>
                  <PencilSimple className="h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onArchiveToggle(goal)}>
                  {archived ? (
                    <>
                      <ArrowCounterClockwise className="h-4 w-4" />
                      Desarchivar
                    </>
                  ) : (
                    <>
                      <Archive className="h-4 w-4" />
                      Archivar
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(goal)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash className="h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="mt-3 flex flex-1 flex-col justify-end">
          <div className="flex items-baseline justify-between gap-2">
            <MoneyAmount value={current} currency={goal.currency_code} size="lg" />
            <span className="text-xs text-muted-foreground">
              de <span className="font-mono tabular">{target.toLocaleString('es-AR')}</span>
            </span>
          </div>

          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-sm bg-secondary">
            <div
              className="h-full rounded-sm bg-primary"
              style={{ width: `${Math.max(2, Math.min(100, pct))}%` }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-mono tabular">{Math.round(pct)}%</span>
            {days && <span>{days}</span>}
          </div>
        </div>

        {!archived && (
          <div className="mt-4 flex items-center gap-1 border-t border-border pt-3">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => onAllocate(goal)}>
              <Plus className="h-4 w-4" />
              Aportar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onRelease(goal)}
              disabled={current <= 0}
            >
              <Minus className="h-4 w-4" />
              Retirar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
