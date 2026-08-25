import { Plus, Minus } from '@phosphor-icons/react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { MoneyAmount } from '@/components/common/MoneyAmount'
import { formatDate } from '@/lib/format'
import { useGetRecentGoalMovementsQuery } from '../goalsApi'

/**
 * Tabla de aportes/retiros de metas.
 *  - Metas (invert=false): aporte = ingreso (+verde), retiro = gasto (−rojo).
 *  - Movimientos (invert=true): se ve al revés respecto del disponible: aportar
 *    saca plata del disponible (gasto), retirar la devuelve (ingreso).
 */
export function GoalActivityTable({ invert = false, title = 'Últimas acciones', emptyMessage = null }) {
  const { data: movements = [], isLoading } = useGetRecentGoalMovementsQuery()

  if (isLoading) return <Skeleton className="h-40 w-full rounded-lg" />
  if (!movements.length) {
    return emptyMessage ? (
      <p className="py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>
    ) : null
  }

  return (
    <section>
      {title && <h2 className="mb-3 font-display text-lg text-foreground">{title}</h2>}
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Meta</TableHead>
              <TableHead>Acción</TableHead>
              <TableHead className="text-right">Monto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.map((m) => {
              const isAllocate = m.movement_type === 'ALLOCATE'
              // "positive" = suma al lado que estamos mirando (meta o disponible).
              const positive = invert ? !isAllocate : isAllocate
              return (
                <TableRow key={m.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDate(m.date)}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{m.goal_name}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center gap-1 text-sm ${
                        positive ? 'text-income-foreground' : 'text-expense-foreground'
                      }`}
                    >
                      {positive ? <Plus className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                      {isAllocate ? 'Aporte' : 'Retiro'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <MoneyAmount
                      value={Number(m.amount)}
                      currency={m.currency_code}
                      size="sm"
                      tone={positive ? 'income' : 'expense'}
                      signed
                    />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </section>
  )
}
