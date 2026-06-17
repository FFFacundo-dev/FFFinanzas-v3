import sql from '../../config/db.js'

export function listOpeningBalances(userId) {
  return sql`
    SELECT user_id, currency_code, amount, updated_at
    FROM public.user_opening_balances
    WHERE user_id = ${userId}
    ORDER BY currency_code ASC
  `
}

export async function upsertOpeningBalance(userId, currencyCode, amount) {
  const code = String(currencyCode).trim().toUpperCase()
  const rows = await sql`
    INSERT INTO public.user_opening_balances (user_id, currency_code, amount, updated_at)
    VALUES (${userId}, ${code}, ${amount}, now())
    ON CONFLICT (user_id, currency_code)
    DO UPDATE SET amount = EXCLUDED.amount, updated_at = now()
    RETURNING user_id, currency_code, amount, updated_at
  `
  return rows[0]
}
