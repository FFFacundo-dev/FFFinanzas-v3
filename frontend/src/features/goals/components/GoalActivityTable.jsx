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

export function GoalActivityTable() {
  const { data: movements = [], isLoading } = useGetRecentGoalMovementsQuery()

  if (isLoading) return <Skeleton className="h-40 w-full rounded-lg" />
  if (!movements.length) return null

  return (
    <section>
      <h2 className="mb-3 font-display text-lg text-foreground">Últimas acciones</h2>
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
              return (
                <TableRow key={m.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDate(m.date)}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{m.goal_name}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center gap-1 text-sm ${
                        isAllocate ? 'text-income-foreground' : 'text-expense-foreground'
                      }`}
                    >
                      {isAllocate ? <Plus className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                      {isAllocate ? 'Aporte' : 'Retiro'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <MoneyAmount
                      value={Number(m.amount)}
                      currency={m.currency_code}
                      size="sm"
                      tone={isAllocate ? 'income' : 'expense'}
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
