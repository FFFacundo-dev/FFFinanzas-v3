import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { parseDate, formatAmount } from '@/lib/format'

const chartConfig = {
  weighted_total_income: { label: 'Ingresos', color: 'var(--income-foreground)' },
  weighted_total_expense: { label: 'Gastos', color: 'var(--expense-foreground)' },
}

const monthFmt = new Intl.DateTimeFormat('es-AR', { month: 'short' })

/** Cashflow mensual ponderado a ARS (PLAN §5.3). */
export function CashflowCard({ data, isLoading }) {
  const rows = (data ?? []).map((d) => ({
    ...d,
    label: monthFmt.format(parseDate(d.month)),
  }))

  return (
    <Card className="shadow-subtle">
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-base font-normal">Cashflow</CardTitle>
        <p className="text-xs text-muted-foreground">Mensual · ponderado a ARS</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[180px] w-full" />
        ) : !rows.length ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Sin movimientos en el período.
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="h-[180px] w-full">
            <AreaChart data={rows} margin={{ left: 4, right: 4, top: 8 }}>
              <defs>
                <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--income-foreground)" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="var(--income-foreground)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="fillExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--expense-foreground)" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="var(--expense-foreground)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={8}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => (
                      <span className="flex w-full justify-between gap-4">
                        <span className="text-muted-foreground">
                          {chartConfig[name]?.label ?? name}
                        </span>
                        <span className="font-mono tabular">{formatAmount(value)}</span>
                      </span>
                    )}
                  />
                }
              />
              <Area
                dataKey="weighted_total_income"
                type="monotone"
                stroke="var(--income-foreground)"
                strokeWidth={2}
                fill="url(#fillIncome)"
              />
              <Area
                dataKey="weighted_total_expense"
                type="monotone"
                stroke="var(--expense-foreground)"
                strokeWidth={2}
                fill="url(#fillExpense)"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
