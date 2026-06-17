import sql from '../../config/db.js'
import { HttpError } from '../../utils/http-error.js'
import { normalizeMonthStart } from '../../utils/money.js'
import { ensureRowExists, ensureSubscriptionOwner, ensureInstallmentOwner } from '../../utils/ensure.js'

// ── Items (manuales + generados por el sistema) ──────────
export function listBudgetItems(userId, periodMonthRaw) {
  const periodMonth = normalizeMonthStart(periodMonthRaw || new Date().toISOString().slice(0, 7))
  return sql`
    WITH params AS (
      SELECT
        ${periodMonth}::date AS month_start,
        (${periodMonth}::date + INTERVAL '1 month' - INTERVAL '1 day')::date AS month_end,
        (${periodMonth}::date - INTERVAL '1 month')::date AS prev_month_start,
        (${periodMonth}::date - INTERVAL '1 day')::date AS prev_month_end
    ),
    manual_items AS (
      SELECT bi.id::text AS id, bi.user_id, bi.period_month, bi.label, bi.amount, bi.flow_type,
        bi.currency_code, bi.item_type, bi.subscription_id, bi.installment_id, bi.created_at, bi.updated_at,
        'MANUAL'::text AS source_kind, true AS editable, true AS deletable, NULL::integer AS summary_count,
        NULL::jsonb AS details, false AS paid, NULL::date AS paid_date, NULL::text AS payment_kind,
        bi.id::text AS source_id, 0 AS sort_bucket
      FROM public.budget_items bi
      WHERE bi.user_id = ${userId} AND bi.period_month = ${periodMonth}
    ),
    pending_subscription_items AS (
      SELECT ('system-subscription-' || s.id::text)::text AS id, ${userId}::bigint AS user_id, p.month_start AS period_month,
        s.name AS label, s.default_amount AS amount, 'EXPENSE'::varchar(10) AS flow_type, s.currency_code,
        'SUBSCRIPTION'::varchar(15) AS item_type, s.id AS subscription_id, NULL::uuid AS installment_id,
        NULL::timestamptz AS created_at, NULL::timestamptz AS updated_at, 'SYSTEM'::text AS source_kind,
        false AS editable, false AS deletable, 1::integer AS summary_count, '[]'::jsonb AS details,
        EXISTS(SELECT 1 FROM public.subscription_payments sp WHERE sp.subscription_id = s.id AND sp.period_month = p.month_start) AS paid,
        (SELECT sp.payment_date FROM public.subscription_payments sp WHERE sp.subscription_id = s.id AND sp.period_month = p.month_start LIMIT 1) AS paid_date,
        'SUBSCRIPTION'::text AS payment_kind, s.id::text AS source_id, 1 AS sort_bucket
      FROM public.subscriptions s CROSS JOIN params p
      WHERE s.user_id = ${userId} AND s.status = 'ACTIVE' AND s.default_amount IS NOT NULL
        AND (s.start_date IS NULL OR DATE_TRUNC('month', s.start_date) <= p.month_start)
    ),
    pending_installment_items AS (
      SELECT ('system-installment-' || i.id::text)::text AS id, ${userId}::bigint AS user_id, p.month_start AS period_month,
        i.description AS label, i.default_amount AS amount, 'EXPENSE'::varchar(10) AS flow_type, i.currency_code,
        'INSTALLMENT'::varchar(15) AS item_type, NULL::uuid AS subscription_id, i.id AS installment_id,
        NULL::timestamptz AS created_at, NULL::timestamptz AS updated_at, 'SYSTEM'::text AS source_kind,
        false AS editable, false AS deletable, 1::integer AS summary_count, '[]'::jsonb AS details,
        EXISTS(SELECT 1 FROM public.installment_payments ip WHERE ip.installment_id = i.id AND ip.payment_date BETWEEN p.month_start AND p.month_end) AS paid,
        (SELECT ip.payment_date FROM public.installment_payments ip WHERE ip.installment_id = i.id AND ip.payment_date BETWEEN p.month_start AND p.month_end LIMIT 1) AS paid_date,
        'INSTALLMENT'::text AS payment_kind, i.id::text AS source_id, 2 AS sort_bucket
      FROM public.installments i CROSS JOIN params p
      WHERE i.user_id = ${userId} AND i.status = 'ACTIVE' AND i.start_date <= p.month_end
        AND (i.total_installments - i.paid_installments_initial
          - COALESCE((SELECT COUNT(*)::int FROM public.installment_payments ip WHERE ip.installment_id = i.id AND ip.payment_date <= p.prev_month_end), 0)
          - COALESCE((SELECT SUM(iap.installments_count)::int FROM public.installment_advance_payments iap WHERE iap.installment_id = i.id AND iap.applies_from_month <= p.prev_month_start), 0)
        ) > 0
    ),
    system_items AS (
      SELECT * FROM pending_subscription_items WHERE amount > 0
      UNION ALL SELECT * FROM pending_installment_items WHERE amount > 0
    )
    SELECT id, user_id, period_month, label, amount, flow_type, currency_code, item_type,
      subscription_id, installment_id, created_at, updated_at, source_kind, editable, deletable,
      summary_count, details, paid, paid_date, payment_kind, source_id
    FROM (SELECT * FROM manual_items UNION ALL SELECT * FROM system_items) items
    ORDER BY sort_bucket ASC, paid_date DESC NULLS LAST, amount DESC, created_at DESC NULLS LAST, label ASC, currency_code ASC
  `
}

async function validateItemRefs(userId, subscriptionId, installmentId) {
  if (subscriptionId) await ensureSubscriptionOwner(userId, subscriptionId)
  if (installmentId) await ensureInstallmentOwner(userId, installmentId)
}

export async function createBudgetItem(userId, payload) {
  const periodMonth = normalizeMonthStart(payload.period_month)
  await validateItemRefs(userId, payload.subscription_id || null, payload.installment_id || null)
  const rows = await sql`
    INSERT INTO public.budget_items
      (user_id, period_month, label, amount, flow_type, currency_code, item_type, subscription_id, installment_id)
    VALUES
      (${userId}, ${periodMonth}, ${payload.label.trim()}, ${payload.amount}, ${payload.flow_type},
       ${String(payload.currency_code || 'ARS').toUpperCase()}, ${payload.item_type},
       ${payload.subscription_id || null}, ${payload.installment_id || null})
    RETURNING id, user_id, period_month, label, amount, flow_type, currency_code, item_type,
              subscription_id, installment_id, created_at, updated_at
  `
  return rows[0]
}

export async function updateBudgetItem(userId, id, payload) {
  await ensureRowExists(sql`SELECT id FROM public.budget_items WHERE id = ${id} AND user_id = ${userId}`, 'Budget item not found')
  const periodMonth = normalizeMonthStart(payload.period_month)
  await validateItemRefs(userId, payload.subscription_id || null, payload.installment_id || null)
  const rows = await sql`
    UPDATE public.budget_items SET
      period_month = ${periodMonth}, label = ${payload.label.trim()}, amount = ${payload.amount},
      flow_type = ${payload.flow_type}, currency_code = ${String(payload.currency_code || 'ARS').toUpperCase()},
      item_type = ${payload.item_type}, subscription_id = ${payload.subscription_id || null}, installment_id = ${payload.installment_id || null}
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING id, user_id, period_month, label, amount, flow_type, currency_code, item_type,
              subscription_id, installment_id, created_at, updated_at
  `
  return rows[0]
}

export async function deleteBudgetItem(userId, id) {
  const rows = await sql`DELETE FROM public.budget_items WHERE id = ${id} AND user_id = ${userId} RETURNING id`
  if (rows.length === 0) throw new HttpError(404, 'Budget item not found')
}

// ── Summary ──────────────────────────────────────────────
export function getBudgetSummary(userId, periodMonthRaw) {
  const periodMonth = normalizeMonthStart(periodMonthRaw || new Date().toISOString().slice(0, 7))
  return sql`
    WITH params AS (
      SELECT ${periodMonth}::date AS month_start,
        (${periodMonth}::date + INTERVAL '1 month' - INTERVAL '1 day')::date AS month_end,
        (${periodMonth}::date - INTERVAL '1 month')::date AS prev_month_start,
        (${periodMonth}::date - INTERVAL '1 day')::date AS prev_month_end
    ),
    subscription_debt AS (
      SELECT s.currency_code, SUM(s.default_amount) AS total_subscription_debt
      FROM public.subscriptions s CROSS JOIN params p
      WHERE s.user_id = ${userId} AND s.status = 'ACTIVE' AND s.default_amount IS NOT NULL
        AND (s.start_date IS NULL OR DATE_TRUNC('month', s.start_date) <= p.month_start)
      GROUP BY s.currency_code
    ),
    installment_debt AS (
      SELECT i.currency_code, SUM(CASE WHEN i.start_date > p.month_end THEN 0
        WHEN (i.total_installments - i.paid_installments_initial
          - COALESCE((SELECT COUNT(*)::int FROM public.installment_payments ip WHERE ip.installment_id = i.id AND ip.payment_date <= p.prev_month_end), 0)
          - COALESCE((SELECT SUM(iap.installments_count)::int FROM public.installment_advance_payments iap WHERE iap.installment_id = i.id AND iap.applies_from_month <= p.prev_month_start), 0)
        ) > 0 THEN i.default_amount ELSE 0 END) AS total_installment_debt
      FROM public.installments i CROSS JOIN params p
      WHERE i.user_id = ${userId} AND i.status = 'ACTIVE'
      GROUP BY i.currency_code
    ),
    hypothetical_items AS (
      SELECT bi.currency_code,
        SUM(CASE WHEN bi.flow_type = 'EXPENSE' THEN bi.amount ELSE 0 END) AS total_hypothetical_expense,
        SUM(CASE WHEN bi.flow_type = 'INCOME' THEN bi.amount ELSE 0 END) AS total_hypothetical_income
      FROM public.budget_items bi CROSS JOIN params p
      WHERE bi.user_id = ${userId} AND bi.period_month = p.month_start
      GROUP BY bi.currency_code
    ),
    all_currencies AS (
      SELECT currency_code FROM subscription_debt
      UNION SELECT currency_code FROM installment_debt
      UNION SELECT currency_code FROM hypothetical_items
    )
    SELECT ac.currency_code,
      COALESCE(sd.total_subscription_debt, 0) AS subscription_debt,
      COALESCE(id.total_installment_debt, 0) AS installment_debt,
      (COALESCE(sd.total_subscription_debt, 0) + COALESCE(id.total_installment_debt, 0)) AS fixed_debt_total,
      COALESCE(hi.total_hypothetical_expense, 0) AS hypothetical_expense_total,
      COALESCE(hi.total_hypothetical_income, 0) AS hypothetical_income_total,
      (COALESCE(hi.total_hypothetical_income, 0) - COALESCE(hi.total_hypothetical_expense, 0)) AS hypothetical_total
    FROM all_currencies ac
    LEFT JOIN subscription_debt sd ON sd.currency_code = ac.currency_code
    LEFT JOIN installment_debt id ON id.currency_code = ac.currency_code
    LEFT JOIN hypothetical_items hi ON hi.currency_code = ac.currency_code
    ORDER BY ac.currency_code ASC
  `
}

// ── Settings (excedente por moneda) ──────────────────────
export function getBudgetSettings(userId, periodMonthRaw) {
  const periodMonth = normalizeMonthStart(periodMonthRaw || new Date().toISOString().slice(0, 7))
  return sql`
    SELECT period_month, currency_code, surplus, updated_at
    FROM public.budget_settings WHERE user_id = ${userId} AND period_month = ${periodMonth}::date
  `
}

export async function upsertBudgetSettings(userId, payload) {
  const periodMonth = normalizeMonthStart(payload.period_month)
  const rows = await sql`
    INSERT INTO public.budget_settings (user_id, period_month, currency_code, surplus, updated_at)
    VALUES (${userId}, ${periodMonth}, ${String(payload.currency_code).toUpperCase()}, ${payload.surplus}, now())
    ON CONFLICT (user_id, period_month, currency_code)
    DO UPDATE SET surplus = EXCLUDED.surplus, updated_at = now()
    RETURNING period_month, currency_code, surplus, created_at, updated_at
  `
  return rows[0]
}
