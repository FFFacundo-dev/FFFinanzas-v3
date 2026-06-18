import { PageHeader } from '@/components/common/PageHeader'
import { toInputDate } from '@/lib/format'
import {
  useGetBalanceByCurrencyQuery,
  useGetSpendingByAccountQuery,
  useGetMonthlyCashflowQuery,
  useGetCategoryBreakdownQuery,
} from './dashboardApi'
import { useGetTransactionsQuery } from '@/features/transactions/transactionsApi'
import { BalanceHero } from './components/BalanceHero'
import { CashflowCard } from './components/CashflowCard'
import { CategoryBreakdownCard } from './components/CategoryBreakdownCard'
import { SpendingByAccountCard } from './components/SpendingByAccountCard'
import { RecentTransactionsCard } from './components/RecentTransactionsCard'

/** Rango del cashflow: desde el 1° del mes, 5 meses atrás (6 meses en total). */
function cashflowFrom() {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() - 5)
  return toInputDate(d)
}

function Block({ children, delay = 0 }) {
  return (
    <div className="animate-fade-in-up" style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

export function DashboardView() {
  const balance = useGetBalanceByCurrencyQuery()
  const spending = useGetSpendingByAccountQuery()
  const cashflow = useGetMonthlyCashflowQuery({ date_from: cashflowFrom() })
  const breakdown = useGetCategoryBreakdownQuery({ movement_type: 'EXPENSE' })
  const recent = useGetTransactionsQuery({ limit: 8 })

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Tu fondo único por moneda, de un vistazo."
      />

      <div className="space-y-6">
        <Block>
          <BalanceHero balances={balance.data} isLoading={balance.isLoading} />
        </Block>

        <div className="grid gap-6 md:grid-cols-2">
          <Block delay={60}>
            <CashflowCard data={cashflow.data} isLoading={cashflow.isLoading} />
          </Block>
          <Block delay={120}>
            <CategoryBreakdownCard
              data={breakdown.data}
              isLoading={breakdown.isLoading}
            />
          </Block>
        </div>

        <Block delay={180}>
          <SpendingByAccountCard data={spending.data} isLoading={spending.isLoading} />
        </Block>

        <Block delay={240}>
          <RecentTransactionsCard data={recent.data} isLoading={recent.isLoading} />
        </Block>
      </div>
    </>
  )
}
