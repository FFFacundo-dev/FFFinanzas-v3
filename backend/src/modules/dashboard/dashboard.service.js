import sql from '../../config/db.js'

export function balanceByCurrency(userId) {
  return sql`
    SELECT user_id, currency_code, total_balance
    FROM public.v_user_balance_by_currency
    WHERE user_id = ${userId}
    ORDER BY currency_code ASC
  `
}

export function spendingByAccount(userId) {
  return sql`
    SELECT s.account_id, a.name AS account_name, a.account_type, s.currency_code, s.total_expense
    FROM public.v_spending_by_account s
    JOIN public.accounts a ON a.id = s.account_id
    WHERE s.user_id = ${userId}
    ORDER BY s.total_expense DESC
  `
}

export function installmentProgress(userId) {
  return sql`
    SELECT
      i.id AS installment_id, i.user_id, i.account_id, i.currency_code, i.description,
      i.total_installments, i.total_amount, i.default_amount, i.paid_installments_initial, i.status,
      COALESCE(p.paid_count, 0) AS paid_via_payments,
      COALESCE(a.advance_count, 0) AS paid_via_advances,
      (i.paid_installments_initial + COALESCE(p.paid_count, 0) + COALESCE(a.advance_count, 0)) AS total_paid,
      GREATEST(0, i.total_installments - i.paid_installments_initial - COALESCE(p.paid_count, 0) - COALESCE(a.advance_count, 0)) AS remaining,
      LEAST(i.total_installments, GREATEST(0,
        (EXTRACT(YEAR FROM AGE(DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', i.start_date)))::int * 12
         + EXTRACT(MONTH FROM AGE(DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', i.start_date)))::int + 1)
      )) AS monthly_due_count,
      GREATEST(0, LEAST(i.total_installments, GREATEST(0,
        (EXTRACT(YEAR FROM AGE(DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', i.start_date)))::int * 12
         + EXTRACT(MONTH FROM AGE(DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', i.start_date)))::int + 1)
      )) - (i.paid_installments_initial + COALESCE(p.paid_count, 0))) AS monthly_pending_count
    FROM public.installments i
    LEFT JOIN (SELECT installment_id, COUNT(*)::int AS paid_count FROM public.installment_payments GROUP BY installment_id) p ON p.installment_id = i.id
    LEFT JOIN (SELECT installment_id, COALESCE(SUM(installments_count), 0)::int AS advance_count FROM public.installment_advance_payments GROUP BY installment_id) a ON a.installment_id = i.id
    WHERE i.user_id = ${userId}
    ORDER BY i.id ASC
  `
}
