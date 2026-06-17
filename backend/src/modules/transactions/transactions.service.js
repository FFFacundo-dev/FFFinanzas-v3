import sql from '../../config/db.js'
import { HttpError } from '../../utils/http-error.js'
import { ensureRowExists, ensureAccountOwner, ensureCategoryOwner, ensureGroupOwner } from '../../utils/ensure.js'

const RETURNING = sql`RETURNING id, user_id, account_id, category_id, group_id, movement_type,
  currency_code, amount, description, date, created_at, updated_at`

export async function listTransactions(userId, query) {
  const accountId = query.account_id ?? null
  const categoryId = query.category_id ?? null
  const movementType = query.movement_type ?? null
  const currencyCode = query.currency_code ?? null
  const dateFrom = query.date_from ?? null
  const dateTo = query.date_to ?? null

  const where = sql`
    WHERE t.user_id = ${userId}
      AND (${accountId}::uuid IS NULL OR t.account_id = ${accountId})
      AND (${categoryId}::uuid IS NULL OR t.category_id = ${categoryId})
      AND (${movementType}::text IS NULL OR t.movement_type = ${movementType})
      AND (${currencyCode}::text IS NULL OR t.currency_code = ${currencyCode})
      AND (${dateFrom}::date IS NULL OR t.date >= ${dateFrom})
      AND (${dateTo}::date IS NULL OR t.date <= ${dateTo})
  `

  const countRows = await sql`SELECT COUNT(*)::int AS total FROM public.transactions t ${where}`
  const rows = await sql`
    SELECT t.id, t.user_id, t.account_id, t.category_id, t.group_id, t.movement_type,
           t.currency_code, t.amount, t.description, t.date, t.created_at, t.updated_at,
           a.name AS account_name, c.name AS category_name
    FROM public.transactions t
    LEFT JOIN public.accounts a   ON a.id = t.account_id
    LEFT JOIN public.categories c ON c.id = t.category_id
    ${where}
    ORDER BY t.date DESC, t.created_at DESC
    LIMIT ${query.limit} OFFSET ${query.offset}
  `
  return { rows, total: countRows[0].total }
}

async function validateRefs(userId, { accountId, categoryId, groupId }) {
  if (accountId) await ensureAccountOwner(userId, accountId)
  if (categoryId) await ensureCategoryOwner(userId, categoryId)
  if (groupId) await ensureGroupOwner(userId, groupId)
}

export async function createTransaction(userId, payload) {
  const accountId = payload.movement_type === 'INCOME' ? (payload.account_id || null) : payload.account_id
  const categoryId = payload.category_id || null
  const groupId = payload.group_id || null
  const currencyCode = String(payload.currency_code).trim().toUpperCase()

  await validateRefs(userId, { accountId, categoryId, groupId })

  const rows = await sql`
    INSERT INTO public.transactions
      (user_id, account_id, category_id, group_id, movement_type, currency_code, amount, description, date)
    VALUES
      (${userId}, ${accountId}, ${categoryId}, ${groupId}, ${payload.movement_type},
       ${currencyCode}, ${payload.amount}, ${payload.description}, ${payload.date})
    ${RETURNING}
  `
  return rows[0]
}

export async function updateTransaction(userId, id, payload, { isPartial }) {
  const existing = await ensureRowExists(
    sql`SELECT * FROM public.transactions WHERE id = ${id} AND user_id = ${userId}`,
    'Transaction not found'
  )

  const movementType = isPartial ? (payload.movement_type ?? existing.movement_type) : payload.movement_type
  const rawAccountId = isPartial ? (payload.account_id ?? existing.account_id) : (payload.account_id ?? null)
  // INCOME nunca lleva cuenta; EXPENSE la requiere.
  const accountId = movementType === 'INCOME' ? null : rawAccountId
  const categoryId = isPartial ? (payload.category_id ?? existing.category_id) : (payload.category_id || null)
  const groupId = isPartial ? (payload.group_id ?? existing.group_id) : (payload.group_id || null)
  const currencyCode = String(isPartial ? (payload.currency_code ?? existing.currency_code) : payload.currency_code)
    .trim().toUpperCase()
  const amount = isPartial ? (payload.amount ?? Number(existing.amount)) : payload.amount
  const description = isPartial ? (payload.description ?? existing.description) : payload.description
  const date = isPartial ? (payload.date ?? existing.date) : payload.date

  if (movementType === 'EXPENSE' && !accountId) {
    throw new HttpError(400, 'account_id is required for expenses')
  }

  await validateRefs(userId, { accountId, categoryId, groupId })

  const rows = await sql`
    UPDATE public.transactions SET
      account_id = ${accountId},
      category_id = ${categoryId},
      group_id = ${groupId},
      movement_type = ${movementType},
      currency_code = ${currencyCode},
      amount = ${amount},
      description = ${description},
      date = ${date}
    WHERE id = ${id} AND user_id = ${userId}
    ${RETURNING}
  `
  return rows[0]
}

// Al borrar una transaccion, limpia los registros de pago vinculados (mantiene
// sincronizados subscription_payments / installment_payments / advance). Sin transfers en v3.
export async function deleteTransaction(userId, id) {
  const deleted = await sql.begin(async (tx) => {
    await tx`DELETE FROM public.installment_payments WHERE transaction_id = ${id} AND user_id = ${userId}`
    await tx`DELETE FROM public.installment_advance_payments WHERE transaction_id = ${id} AND user_id = ${userId}`
    await tx`DELETE FROM public.subscription_payments WHERE transaction_id = ${id} AND user_id = ${userId}`
    return tx`DELETE FROM public.transactions WHERE id = ${id} AND user_id = ${userId} RETURNING id`
  })
  if (deleted.length === 0) throw new HttpError(404, 'Transaction not found')
}
