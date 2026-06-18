import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { MoneyAmount } from '@/components/common/MoneyAmount'

const TOP = 6

/** Agrega filas (categoría × moneda) en una sola por categoría, ponderado a ARS. */
function aggregate(rows = []) {
  const byCat = new Map()
  for (const r of rows) {
    const key = r.category_id
    const prev = byCat.get(key) || {
      category_id: key,
      category_name: r.category_name,
      weighted: 0,
      percentage: 0,
    }
    prev.weighted += Number(r.weighted_total_amount || 0)
    prev.percentage += Number(r.percentage || 0)
    byCat.set(key, prev)
  }
  return Array.from(byCat.values())
    .sort((a, b) => b.weighted - a.weighted)
    .slice(0, TOP)
}

/** Gasto por categoría (PLAN §5.3). */
export function CategoryBreakdownCard({ data, isLoading }) {
  const rows = aggregate(data?.data)

  return (
    <Card className="shadow-subtle">
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-base font-normal">
          Gasto por categoría
        </CardTitle>
        <p className="text-xs text-muted-foreground">Ponderado a ARS</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4 py-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        ) : !rows.length ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Sin gastos para mostrar.
          </p>
        ) : (
          <ul className="space-y-3.5">
            {rows.map((r) => (
              <li key={r.category_id}>
                <div className="mb-1.5 flex items-baseline justify-between gap-3">
                  <span className="truncate text-sm text-foreground">
                    {r.category_name}
                  </span>
                  <MoneyAmount value={r.weighted} currency="ARS" size="sm" />
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-sm bg-secondary">
                  <div
                    className="h-full rounded-sm bg-primary"
                    style={{ width: `${Math.max(2, Math.min(100, r.percentage))}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
