import sql from '../../config/db.js'

export function listCurrencies() {
  return sql`
    SELECT code, name, symbol, is_active
    FROM public.currencies
    WHERE is_active = true
    ORDER BY code ASC
  `
}
