import sql from '../../config/db.js'
import { getExchangeRatesSnapshot, toWeightedArsAmount } from '../../utils/exchange-rates.js'
import { ensureAccountOwner } from '../../utils/ensure.js'

function weightDebtRows(rows, ratesSnapshot) {
  return rows.map((row) => {
    const weighted = toWeightedArsAmount(Number(row.total_debt || 0), row.currency_code, ratesSnapshot)
    return {
      ...row,
      total_debt: Number(row.total_debt || 0),
      weighted_total_debt: weighted.weighted_amount_ars,
      conversion_available: weighted.conversion_available
    }
  })
}

export async function subscriptionDebtByCategory(userId) {
  const rates = await getExchangeRatesSnapshot()
  const rows = await sql`
    SELECT COALESCE(c.id::text, 'uncategorized') AS category_id, COALESCE(c.name, 'Sin categoria') AS category_name,
      s.currency_code, SUM(s.default_amount) AS total_debt
    FROM public.subscriptions s
    LEFT JOIN public.categories c ON c.id = s.category_id
    WHERE s.user_id = ${userId} AND s.status = 'ACTIVE' AND s.default_amount IS NOT NULL
    GROUP BY c.id, c.name, s.currency_code
    ORDER BY total_debt DESC, category_name ASC
  `
  return weightDebtRows(rows, rates)
}

export async function subscriptionDebtByAccount(userId) {
  const rates = await getExchangeRatesSnapshot()
  const rows = await sql`
    SELECT COALESCE(a.id::text, 'unassigned') AS account_id, COALESCE(a.name, 'Sin cuenta') AS account_name,
      s.currency_code, SUM(s.default_amount) AS total_debt
    FROM public.subscriptions s
    LEFT JOIN public.accounts a ON a.id = s.account_id
    WHERE s.user_id = ${userId} AND s.status = 'ACTIVE' AND s.default_amount IS NOT NULL
    GROUP BY a.id, a.name, s.currency_code
    ORDER BY total_debt DESC, account_name ASC
  `
  return weightDebtRows(rows, rates)
}

export async function installmentDebtByCategory(userId) {
  const rates = await getExchangeRatesSnapshot()
  const rows = await sql`
    SELECT COALESCE(c.id::text, 'uncategorized') AS category_id, COALESCE(c.name, 'Sin categoria') AS category_name,
      i.currency_code,
      SUM(GREATEST(0, i.total_installments - i.paid_installments_initial - COALESCE(p.paid_count, 0) - COALESCE(a.advance_count, 0)) * i.default_amount) AS total_debt
    FROM public.installments i
    LEFT JOIN public.categories c ON c.id = i.category_id
    LEFT JOIN (SELECT installment_id, COUNT(*)::int AS paid_count FROM public.installment_payments GROUP BY installment_id) p ON p.installment_id = i.id
    LEFT JOIN (SELECT installment_id, COALESCE(SUM(installments_count), 0)::int AS advance_count FROM public.installment_advance_payments GROUP BY installment_id) a ON a.installment_id = i.id
    WHERE i.user_id = ${userId} AND i.status = 'ACTIVE'
    GROUP BY c.id, c.name, i.currency_code
    ORDER BY total_debt DESC, category_name ASC
  `
  return weightDebtRows(rows, rates)
}

export async function installmentDebtByAccount(userId) {
  const rates = await getExchangeRatesSnapshot()
  const rows = await sql`
    SELECT COALESCE(a.id::text, 'unassigned') AS account_id, COALESCE(a.name, 'Sin cuenta') AS account_name,
      i.currency_code,
      SUM(GREATEST(0, i.total_installments - i.paid_installments_initial - COALESCE(p.paid_count, 0) - COALESCE(av.advance_count, 0)) * i.default_amount) AS total_debt
    FROM public.installments i
    LEFT JOIN public.accounts a ON a.id = i.account_id
    LEFT JOIN (SELECT installment_id, COUNT(*)::int AS paid_count FROM public.installment_payments GROUP BY installment_id) p ON p.installment_id = i.id
    LEFT JOIN (SELECT installment_id, COALESCE(SUM(installments_count), 0)::int AS advance_count FROM public.installment_advance_payments GROUP BY installment_id) av ON av.installment_id = i.id
    WHERE i.user_id = ${userId} AND i.status = 'ACTIVE'
    GROUP BY a.id, a.name, i.currency_code
    ORDER BY total_debt DESC, account_name ASC
  `
  return weightDebtRows(rows, rates)
}

export async function monthlyCashflow(userId, query) {
  const rates = await getExchangeRatesSnapshot()
  const accountId = query.account_id ?? null
  const dateFrom = query.date_from ?? null
  const dateTo = query.date_to ?? null
  if (accountId) await ensureAccountOwner(userId, accountId)

  const rows = await sql`
    SELECT DATE_TRUNC('month', t.date)::date AS month, t.currency_code,
      SUM(CASE WHEN t.movement_type = 'INCOME' THEN t.amount ELSE 0 END) AS total_income,
      SUM(CASE WHEN t.movement_type = 'EXPENSE' THEN t.amount ELSE 0 END) AS total_expense,
      SUM(CASE WHEN t.movement_type = 'INCOME' THEN t.amount ELSE -t.amount END) AS net_balance
    FROM public.transactions t
    WHERE t.user_id = ${userId}
      AND (${accountId}::uuid IS NULL OR t.account_id = ${accountId})
      AND (${dateFrom}::date IS NULL OR t.date >= ${dateFrom})
      AND (${dateTo}::date IS NULL OR t.date <= ${dateTo})
    GROUP BY DATE_TRUNC('month', t.date), t.currency_code
    ORDER BY month ASC, t.currency_code ASC
  `

  const byMonth = new Map()
  for (const row of rows) {
    const month = row.month
    const income = Number(row.total_income || 0)
    const expense = Number(row.total_expense || 0)
    const net = Number(row.net_balance || 0)
    const wIncome = toWeightedArsAmount(income, row.currency_code, rates)
    const wExpense = toWeightedArsAmount(expense, row.currency_code, rates)
    const wNet = toWeightedArsAmount(net, row.currency_code, rates)

    const current = byMonth.get(month) || {
      month, total_income: 0, total_expense: 0, net_balance: 0,
      weighted_total_income: 0, weighted_total_expense: 0, weighted_net_balance: 0, excluded_from_weighting: false
    }
    current.total_income += income
    current.total_expense += expense
    current.net_balance += net
    current.weighted_total_income += Number(wIncome.weighted_amount_ars || 0)
    current.weighted_total_expense += Number(wExpense.weighted_amount_ars || 0)
    current.weighted_net_balance += Number(wNet.weighted_amount_ars || 0)
    if (!wIncome.conversion_available || !wExpense.conversion_available || !wNet.conversion_available) {
      current.excluded_from_weighting = true
    }
    byMonth.set(month, current)
  }

  return Array.from(byMonth.values())
    .sort((a, b) => String(a.month).localeCompare(String(b.month)))
    .map((item) => ({
      ...item,
      total_income: Number(item.total_income.toFixed(2)),
      total_expense: Number(item.total_expense.toFixed(2)),
      net_balance: Number(item.net_balance.toFixed(2)),
      weighted_total_income: Number(item.weighted_total_income.toFixed(2)),
      weighted_total_expense: Number(item.weighted_total_expense.toFixed(2)),
      weighted_net_balance: Number(item.weighted_net_balance.toFixed(2))
    }))
}

export async function categoryBreakdown(userId, query) {
  const rates = await getExchangeRatesSnapshot()
  const accountId = query.account_id ?? null
  const movementType = query.movement_type ?? null
  const dateFrom = query.date_from ?? null
  const dateTo = query.date_to ?? null
  if (accountId) await ensureAccountOwner(userId, accountId)

  const rows = await sql`
    SELECT COALESCE(c.id::text, 'uncategorized') AS category_id, COALESCE(c.name, 'Sin categoria') AS category_name,
      t.movement_type, t.currency_code, COUNT(*)::int AS transaction_count, SUM(t.amount) AS total_amount
    FROM public.transactions t
    LEFT JOIN public.categories c ON c.id = t.category_id
    WHERE t.user_id = ${userId}
      AND (${accountId}::uuid IS NULL OR t.account_id = ${accountId})
      AND (${movementType}::text IS NULL OR t.movement_type = ${movementType})
      AND (${dateFrom}::date IS NULL OR t.date >= ${dateFrom})
      AND (${dateTo}::date IS NULL OR t.date <= ${dateTo})
    GROUP BY c.id, c.name, t.movement_type, t.currency_code
    ORDER BY total_amount DESC, category_name ASC
  `

  const withWeights = rows.map((row) => {
    const total = Number(row.total_amount || 0)
    const weighted = toWeightedArsAmount(total, row.currency_code, rates)
    return {
      ...row, total_amount: total,
      weighted_total_amount: weighted.weighted_amount_ars,
      conversion_available: weighted.conversion_available,
      percentage: 0
    }
  })

  const grandTotal = withWeights.reduce((acc, item) => acc + Number(item.weighted_total_amount || 0), 0)
  const sorted = withWeights
    .map((item) => ({
      ...item,
      percentage: grandTotal > 0 && Number(item.weighted_total_amount || 0) > 0
        ? Number(((Number(item.weighted_total_amount) / grandTotal) * 100).toFixed(2)) : 0
    }))
    .sort((a, b) => Number(b.weighted_total_amount || 0) - Number(a.weighted_total_amount || 0))

  return {
    data: sorted.slice(query.offset, query.offset + query.limit),
    meta: { limit: query.limit, offset: query.offset, grand_total: Number(grandTotal.toFixed(2)) }
  }
}
