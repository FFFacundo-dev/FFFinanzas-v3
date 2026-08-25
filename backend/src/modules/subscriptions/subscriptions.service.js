import sql from '../../config/db.js'
import { HttpError } from '../../utils/http-error.js'
import { normalizeMonthStart } from '../../utils/money.js'
import { ensureRowExists, ensureAccountOwner, ensureCategoryOwner } from '../../utils/ensure.js'
import { releaseFromGoalTx } from '../goals/goals.service.js'

const SUB_COLUMNS = sql`id, user_id, category_id, name, description, currency_code,
  default_amount, account_id, billing_day, start_date, status, created_at, updated_at`

function normalizeSubscription(payload) {
  return {
    name: String(payload.name).trim(),
    description: payload.description ? String(payload.description) : null,
    currencyCode: String(payload.currency_code || 'ARS').trim().toUpperCase(),
    defaultAmount: payload.default_amount ?? null,
    accountId: payload.account_id || null,
    categoryId: payload.category_id || null,
    billingDay: payload.billing_day ?? null,
    startDate: payload.start_date || null,
    status: String(payload.status || 'ACTIVE').toUpperCase()
  }
}

export function listSubscriptions(userId) {
  return sql`SELECT ${SUB_COLUMNS} FROM public.subscriptions WHERE user_id = ${userId} ORDER BY created_at DESC`
}

export async function createSubscription(userId, payload) {
  const s = normalizeSubscription(payload)
  if (s.accountId) await ensureAccountOwner(userId, s.accountId)
  if (s.categoryId) await ensureCategoryOwner(userId, s.categoryId)

  const rows = await sql`
    INSERT INTO public.subscriptions
      (user_id, category_id, name, description, currency_code, default_amount, account_id, billing_day, start_date, status)
    VALUES
      (${userId}, ${s.categoryId}, ${s.name}, ${s.description}, ${s.currencyCode},
       ${s.defaultAmount}, ${s.accountId}, ${s.billingDay}, ${s.startDate}, ${s.status})
    RETURNING ${SUB_COLUMNS}
  `
  return rows[0]
}

export async function updateSubscription(userId, id, payload) {
  await ensureRowExists(
    sql`SELECT id FROM public.subscriptions WHERE id = ${id} AND user_id = ${userId}`, 'Subscription not found'
  )
  const s = normalizeSubscription(payload)
  if (s.accountId) await ensureAccountOwner(userId, s.accountId)
  if (s.categoryId) await ensureCategoryOwner(userId, s.categoryId)

  const rows = await sql`
    UPDATE public.subscriptions SET
      category_id = ${s.categoryId}, name = ${s.name}, description = ${s.description},
      currency_code = ${s.currencyCode}, default_amount = ${s.defaultAmount}, account_id = ${s.accountId},
      billing_day = ${s.billingDay}, start_date = ${s.startDate}, status = ${s.status}
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING ${SUB_COLUMNS}
  `
  return rows[0]
}

export async function deleteSubscription(userId, id) {
  const rows = await sql`DELETE FROM public.subscriptions WHERE id = ${id} AND user_id = ${userId} RETURNING id`
  if (rows.length === 0) throw new HttpError(404, 'Subscription not found')
}

export function listSubscriptionPayments(userId) {
  return sql`
    SELECT id, subscription_id, user_id, account_id, amount, payment_date,
           period_month, transaction_id, notes, created_at, updated_at
    FROM public.subscription_payments
    WHERE user_id = ${userId}
    ORDER BY payment_date DESC, created_at DESC
  `
}

export async function createSubscriptionPayment(userId, payload) {
  const amount = Number(payload.amount)
  const periodMonth = normalizeMonthStart(payload.period_month)
  const notes = payload.notes ? String(payload.notes) : null

  const subscription = await ensureRowExists(
    sql`SELECT id, name, account_id, category_id, currency_code FROM public.subscriptions
        WHERE id = ${payload.subscription_id} AND user_id = ${userId}`,
    'Subscription not found'
  )

  // El pago genera un EXPENSE, que requiere cuenta (etiqueta). Se usa la del pago o la del plan.
  const accountId = payload.account_id || subscription.account_id || null
  if (!accountId) throw new HttpError(400, 'account_id is required (the subscription has no default account)')
  await ensureAccountOwner(userId, accountId)

  const existing = await sql`
    SELECT id FROM public.subscription_payments
    WHERE subscription_id = ${subscription.id} AND period_month = ${periodMonth} LIMIT 1
  `
  if (existing.length > 0) throw new HttpError(409, 'Subscription payment for this month already exists')

  return sql.begin(async (tx) => {
    const txRows = await tx`
      INSERT INTO public.transactions
        (user_id, account_id, category_id, movement_type, currency_code, amount, description, date)
      VALUES
        (${userId}, ${accountId}, ${subscription.category_id || null}, 'EXPENSE',
         ${subscription.currency_code}, ${amount}, ${`Pago suscripcion: ${subscription.name}`}, ${payload.payment_date})
      RETURNING id
    `
    const paymentRows = await tx`
      INSERT INTO public.subscription_payments
        (subscription_id, user_id, account_id, amount, payment_date, period_month, transaction_id, notes)
      VALUES
        (${subscription.id}, ${userId}, ${accountId}, ${amount}, ${payload.payment_date}, ${periodMonth}, ${txRows[0].id}, ${notes})
      RETURNING id, subscription_id, user_id, account_id, amount, payment_date, period_month, transaction_id, notes, created_at, updated_at
    `
    if (payload.goal_id) {
      await releaseFromGoalTx(tx, userId, payload.goal_id, amount, subscription.currency_code)
    }
    return paymentRows[0]
  })
}

export async function deleteSubscriptionPayment(userId, id) {
  const payment = await ensureRowExists(
    sql`SELECT id, transaction_id FROM public.subscription_payments WHERE id = ${id} AND user_id = ${userId}`,
    'Subscription payment not found'
  )
  await sql.begin(async (tx) => {
    await tx`DELETE FROM public.subscription_payments WHERE id = ${payment.id} AND user_id = ${userId}`
    if (payment.transaction_id) {
      await tx`DELETE FROM public.transactions WHERE id = ${payment.transaction_id} AND user_id = ${userId}`
    }
  })
}
