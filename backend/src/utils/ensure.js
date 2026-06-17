import sql from '../config/db.js'
import { HttpError } from './http-error.js'

// Devuelve la primera fila o lanza 404. Util para chequeos de pertenencia.
export async function ensureRowExists(queryPromise, notFoundMessage) {
  const rows = await queryPromise
  if (rows.length === 0) throw new HttpError(404, notFoundMessage)
  return rows[0]
}

export async function ensureAccountOwner(userId, accountId) {
  return ensureRowExists(
    sql`SELECT id FROM public.accounts WHERE id = ${accountId} AND user_id = ${userId}`,
    'Account not found'
  )
}

export async function ensureCategoryOwner(userId, categoryId) {
  return ensureRowExists(
    sql`SELECT id FROM public.categories WHERE id = ${categoryId} AND user_id = ${userId}`,
    'Category not found'
  )
}

export async function ensureGroupOwner(userId, groupId) {
  return ensureRowExists(
    sql`SELECT id FROM public.transaction_groups WHERE id = ${groupId} AND user_id = ${userId}`,
    'Transaction group not found'
  )
}

export async function ensureSubscriptionOwner(userId, subscriptionId) {
  return ensureRowExists(
    sql`SELECT id FROM public.subscriptions WHERE id = ${subscriptionId} AND user_id = ${userId}`,
    'Subscription not found'
  )
}

export async function ensureInstallmentOwner(userId, installmentId) {
  return ensureRowExists(
    sql`SELECT id, total_installments FROM public.installments WHERE id = ${installmentId} AND user_id = ${userId}`,
    'Installment not found'
  )
}
