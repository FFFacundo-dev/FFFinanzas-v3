import sql from '../../config/db.js'
import { HttpError } from '../../utils/http-error.js'

export function listExchanges(userId) {
  return sql`
    SELECT id, user_id, from_currency_code, to_currency_code, from_amount, to_amount,
           exchange_rate, description, date, created_at, updated_at
    FROM public.exchanges
    WHERE user_id = ${userId}
    ORDER BY date DESC, created_at DESC
  `
}

export async function createExchange(userId, payload) {
  const fromCurrency = String(payload.from_currency_code).trim().toUpperCase()
  const toCurrency = String(payload.to_currency_code).trim().toUpperCase()
  const fromAmount = Number(payload.from_amount)
  const toAmount = Number(payload.to_amount)
  const rate = Number((toAmount / fromAmount).toFixed(6))
  const description = payload.description ? String(payload.description) : null

  const rows = await sql`
    INSERT INTO public.exchanges
      (user_id, from_currency_code, to_currency_code, from_amount, to_amount, exchange_rate, description, date)
    VALUES
      (${userId}, ${fromCurrency}, ${toCurrency}, ${fromAmount}, ${toAmount}, ${rate}, ${description}, ${payload.date})
    RETURNING id, user_id, from_currency_code, to_currency_code, from_amount, to_amount,
              exchange_rate, description, date, created_at, updated_at
  `
  return rows[0]
}

export async function deleteExchange(userId, id) {
  const rows = await sql`DELETE FROM public.exchanges WHERE id = ${id} AND user_id = ${userId} RETURNING id`
  if (rows.length === 0) throw new HttpError(404, 'Exchange not found')
}
