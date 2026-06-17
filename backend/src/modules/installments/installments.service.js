import sql from '../../config/db.js'
import { HttpError, toPositiveNumber } from '../../utils/http-error.js'
import {
  buildInstallmentDistributionCents,
  sumInstallmentRangeCents,
  centsToMoney,
  normalizeMonthStart
} from '../../utils/money.js'
import { ensureRowExists, ensureAccountOwner, ensureCategoryOwner } from '../../utils/ensure.js'

const INST_COLUMNS = sql`id, user_id, account_id, category_id, description, currency_code,
  total_installments, total_amount, default_amount, billing_day, start_date,
  paid_installments_initial, status, created_at, updated_at`

function resolveInstallmentAmounts(payload, totalInstallments) {
  const totalAmount = payload.total_amount == null ? null : toPositiveNumber(payload.total_amount, 'total_amount')
  const defaultAmount = payload.default_amount == null ? null : toPositiveNumber(payload.default_amount, 'default_amount')
  if (totalAmount == null && defaultAmount == null) throw new HttpError(400, 'total_amount is required')

  if (totalAmount != null) {
    const distribution = buildInstallmentDistributionCents(totalAmount, totalInstallments)
    return {
      totalAmount: centsToMoney(distribution.reduce((acc, c) => acc + c, 0)),
      defaultAmount: centsToMoney(distribution[0])
    }
  }
  return { totalAmount: Number((defaultAmount * totalInstallments).toFixed(2)), defaultAmount }
}

export function listInstallments(userId) {
  return sql`SELECT ${INST_COLUMNS} FROM public.installments WHERE user_id = ${userId} ORDER BY created_at DESC`
}

export async function createInstallment(userId, payload) {
  const currencyCode = String(payload.currency_code || 'ARS').trim().toUpperCase()
  const paidInitial = payload.paid_installments_initial || 0

  let totalInstallments
  let totalAmount
  let defaultAmount

  if (payload.mode === 'custom') {
    const totalCents = Math.round(payload.total_amount * 100)
    const instCents = Math.round(payload.installment_amount * 100)
    const qty = Math.floor(totalCents / instCents)
    totalInstallments = totalCents % instCents > 0 ? qty + 1 : qty
    totalAmount = payload.total_amount
    defaultAmount = payload.installment_amount
  } else {
    totalInstallments = payload.total_installments
    const amounts = resolveInstallmentAmounts(payload, totalInstallments)
    totalAmount = amounts.totalAmount
    defaultAmount = amounts.defaultAmount
  }

  if (paidInitial >= totalInstallments) {
    throw new HttpError(400, 'paid_installments_initial must be less than total_installments')
  }

  if (payload.account_id) await ensureAccountOwner(userId, payload.account_id)
  if (payload.category_id) await ensureCategoryOwner(userId, payload.category_id)

  const rows = await sql`
    INSERT INTO public.installments
      (user_id, account_id, category_id, description, currency_code, total_installments,
       total_amount, default_amount, billing_day, start_date, paid_installments_initial, status)
    VALUES
      (${userId}, ${payload.account_id || null}, ${payload.category_id || null}, ${payload.description},
       ${currencyCode}, ${totalInstallments}, ${totalAmount}, ${defaultAmount},
       ${payload.billing_day ?? null}, ${payload.start_date}, ${paidInitial}, ${String(payload.status || 'ACTIVE').toUpperCase()})
    RETURNING ${INST_COLUMNS}
  `
  return rows[0]
}

export async function updateInstallment(userId, id, payload) {
  await ensureRowExists(
    sql`SELECT id FROM public.installments WHERE id = ${id} AND user_id = ${userId}`, 'Installment not found'
  )
  const totalInstallments = Number(payload.total_installments)
  const paidInitial = payload.paid_installments_initial == null ? 0 : Number(payload.paid_installments_initial)
  if (paidInitial >= totalInstallments) {
    throw new HttpError(400, 'paid_installments_initial must be less than total_installments')
  }
  const amounts = resolveInstallmentAmounts(payload, totalInstallments)
  if (payload.account_id) await ensureAccountOwner(userId, payload.account_id)
  if (payload.category_id) await ensureCategoryOwner(userId, payload.category_id)

  const rows = await sql`
    UPDATE public.installments SET
      account_id = ${payload.account_id || null},
      category_id = ${payload.category_id || null},
      description = ${payload.description},
      currency_code = ${String(payload.currency_code || 'ARS').trim().toUpperCase()},
      total_installments = ${totalInstallments},
      total_amount = ${amounts.totalAmount},
      default_amount = ${amounts.defaultAmount},
      billing_day = ${payload.billing_day ?? null},
      start_date = ${payload.start_date},
      paid_installments_initial = ${paidInitial},
      status = ${String(payload.status || 'ACTIVE').toUpperCase()}
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING ${INST_COLUMNS}
  `
  return rows[0]
}

export async function deleteInstallment(userId, id) {
  const deleted = await sql.begin(async (tx) => {
    const linked = await tx`
      SELECT transaction_id FROM public.installment_payments WHERE installment_id = ${id} AND user_id = ${userId}
      UNION
      SELECT transaction_id FROM public.installment_advance_payments WHERE installment_id = ${id} AND user_id = ${userId}
    `
    const removed = await tx`DELETE FROM public.installments WHERE id = ${id} AND user_id = ${userId} RETURNING id`
    if (removed.length === 0) return null
    for (const row of linked) {
      if (row.transaction_id) {
        await tx`DELETE FROM public.transactions WHERE id = ${row.transaction_id} AND user_id = ${userId}`
      }
    }
    return removed[0]
  })
  if (!deleted) throw new HttpError(404, 'Installment not found')
}

// ── Pagos de cuota ───────────────────────────────────────
export function listInstallmentPayments(userId) {
  return sql`
    SELECT id, installment_id, user_id, installment_number, amount_override,
           payment_date, transaction_id, notes, created_at, updated_at
    FROM public.installment_payments WHERE user_id = ${userId}
    ORDER BY payment_date DESC, created_at DESC
  `
}

export async function createInstallmentPayment(userId, payload) {
  const installmentNumber = Number(payload.installment_number)
  const amountOverride = payload.amount_override == null ? null : toPositiveNumber(payload.amount_override, 'amount_override')
  const notes = payload.notes ? String(payload.notes) : null

  const installment = await ensureRowExists(
    sql`SELECT id, total_installments, total_amount, default_amount, account_id, category_id, description, currency_code
        FROM public.installments WHERE id = ${payload.installment_id} AND user_id = ${userId}`,
    'Installment not found'
  )
  if (installmentNumber > installment.total_installments) {
    throw new HttpError(400, 'installment_number cannot exceed total installments')
  }

  const distribution = buildInstallmentDistributionCents(
    installment.total_amount ?? Number(installment.default_amount) * Number(installment.total_installments),
    installment.total_installments,
    installment.default_amount
  )
  const scheduled = centsToMoney(distribution[installmentNumber - 1])
  const amount = Number(amountOverride ?? scheduled)
  if (!Number.isFinite(amount) || amount <= 0) throw new HttpError(400, 'Could not resolve installment payment amount')

  const accountId = payload.account_id || installment.account_id || null
  if (!accountId) throw new HttpError(400, 'account_id is required (the installment has no default account)')
  await ensureAccountOwner(userId, accountId)

  return sql.begin(async (tx) => {
    const txRows = await tx`
      INSERT INTO public.transactions
        (user_id, account_id, category_id, movement_type, currency_code, amount, description, date)
      VALUES
        (${userId}, ${accountId}, ${installment.category_id || null}, 'EXPENSE', ${installment.currency_code},
         ${amount}, ${`Pago cuota ${installmentNumber}: ${installment.description || 'Plan de cuotas'}`}, ${payload.payment_date})
      RETURNING id
    `
    const paymentRows = await tx`
      INSERT INTO public.installment_payments
        (installment_id, user_id, installment_number, amount_override, payment_date, transaction_id, notes)
      VALUES
        (${installment.id}, ${userId}, ${installmentNumber}, ${amountOverride}, ${payload.payment_date}, ${txRows[0].id}, ${notes})
      RETURNING id, installment_id, user_id, installment_number, amount_override, payment_date, transaction_id, notes, created_at, updated_at
    `
    return paymentRows[0]
  })
}

export async function deleteInstallmentPayment(userId, id) {
  const payment = await ensureRowExists(
    sql`SELECT id, transaction_id FROM public.installment_payments WHERE id = ${id} AND user_id = ${userId}`,
    'Installment payment not found'
  )
  await sql.begin(async (tx) => {
    await tx`DELETE FROM public.installment_payments WHERE id = ${payment.id} AND user_id = ${userId}`
    if (payment.transaction_id) {
      await tx`DELETE FROM public.transactions WHERE id = ${payment.transaction_id} AND user_id = ${userId}`
    }
  })
}

// ── Adelantos (sin transfer en v3) ───────────────────────
export function listInstallmentAdvancePayments(userId) {
  return sql`
    SELECT id, installment_id, user_id, installments_count, total_amount,
           payment_date, applies_from_month, transaction_id, notes, created_at, updated_at
    FROM public.installment_advance_payments WHERE user_id = ${userId}
    ORDER BY payment_date DESC, created_at DESC
  `
}

export async function createInstallmentAdvancePayment(userId, payload) {
  const installmentsCount = Number(payload.installments_count)
  const appliesFromMonth = normalizeMonthStart(payload.applies_from_month, 'applies_from_month')
  const notes = payload.notes ? String(payload.notes) : null

  const installment = await ensureRowExists(
    sql`SELECT id, total_installments, total_amount, default_amount, account_id, category_id, description, currency_code
        FROM public.installments WHERE id = ${payload.installment_id} AND user_id = ${userId}`,
    'Installment not found'
  )

  const progress = await sql`
    SELECT i.total_installments, i.paid_installments_initial,
           COALESCE(p.paid_count, 0) AS paid_via_payments,
           COALESCE(a.advance_count, 0) AS paid_via_advances
    FROM public.installments i
    LEFT JOIN (SELECT installment_id, COUNT(*)::int AS paid_count FROM public.installment_payments
               WHERE installment_id = ${installment.id} GROUP BY installment_id) p ON p.installment_id = i.id
    LEFT JOIN (SELECT installment_id, COALESCE(SUM(installments_count),0)::int AS advance_count
               FROM public.installment_advance_payments WHERE installment_id = ${installment.id} GROUP BY installment_id) a ON a.installment_id = i.id
    WHERE i.id = ${installment.id} AND i.user_id = ${userId}
  `
  const current = progress[0]
  const currentPaid = Number(current.paid_installments_initial || 0)
    + Number(current.paid_via_payments || 0) + Number(current.paid_via_advances || 0)
  const remaining = Number(current.total_installments) - currentPaid
  if (installmentsCount > remaining) throw new HttpError(400, 'installments_count cannot exceed remaining installments')

  const distribution = buildInstallmentDistributionCents(
    installment.total_amount ?? Number(installment.default_amount) * Number(installment.total_installments),
    installment.total_installments,
    installment.default_amount
  )
  const totalAmount = centsToMoney(sumInstallmentRangeCents(distribution, currentPaid + 1, installmentsCount))
  if (!Number.isFinite(totalAmount) || totalAmount <= 0) throw new HttpError(400, 'Could not calculate advance total_amount')

  const accountId = payload.account_id || installment.account_id || null
  if (!accountId) throw new HttpError(400, 'account_id is required (the installment has no default account)')
  await ensureAccountOwner(userId, accountId)

  return sql.begin(async (tx) => {
    const txRows = await tx`
      INSERT INTO public.transactions
        (user_id, account_id, category_id, movement_type, currency_code, amount, description, date)
      VALUES
        (${userId}, ${accountId}, ${installment.category_id || null}, 'EXPENSE', ${installment.currency_code},
         ${totalAmount}, ${`Adelanto de ${installmentsCount} cuota(s): ${installment.description || 'Plan de cuotas'}`}, ${payload.payment_date})
      RETURNING id
    `
    const advanceRows = await tx`
      INSERT INTO public.installment_advance_payments
        (installment_id, user_id, installments_count, total_amount, payment_date, applies_from_month, transaction_id, notes)
      VALUES
        (${installment.id}, ${userId}, ${installmentsCount}, ${totalAmount}, ${payload.payment_date}, ${appliesFromMonth}, ${txRows[0].id}, ${notes})
      RETURNING id, installment_id, user_id, installments_count, total_amount, payment_date, applies_from_month, transaction_id, notes, created_at, updated_at
    `
    return advanceRows[0]
  })
}

export async function deleteInstallmentAdvancePayment(userId, id) {
  const advance = await ensureRowExists(
    sql`SELECT id, transaction_id FROM public.installment_advance_payments WHERE id = ${id} AND user_id = ${userId}`,
    'Installment advance payment not found'
  )
  await sql.begin(async (tx) => {
    await tx`DELETE FROM public.installment_advance_payments WHERE id = ${advance.id} AND user_id = ${userId}`
    if (advance.transaction_id) {
      await tx`DELETE FROM public.transactions WHERE id = ${advance.transaction_id} AND user_id = ${userId}`
    }
  })
}
