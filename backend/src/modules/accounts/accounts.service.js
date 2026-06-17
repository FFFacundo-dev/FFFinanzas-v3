import sql from '../../config/db.js'
import { HttpError } from '../../utils/http-error.js'

export function listAccounts(userId) {
  return sql`
    SELECT id, user_id, name, account_type, color, icon, is_active, created_at, updated_at
    FROM public.accounts
    WHERE user_id = ${userId}
    ORDER BY name ASC
  `
}

export async function createAccount(userId, payload) {
  const rows = await sql`
    INSERT INTO public.accounts (user_id, name, account_type, color, icon, is_active)
    VALUES (
      ${userId}, ${payload.name}, ${payload.account_type},
      ${payload.color ?? null}, ${payload.icon ?? null}, ${payload.is_active ?? true}
    )
    RETURNING id, user_id, name, account_type, color, icon, is_active, created_at, updated_at
  `
  return rows[0]
}

export async function updateAccount(userId, id, payload) {
  const rows = await sql`
    UPDATE public.accounts SET
      name = ${payload.name},
      account_type = ${payload.account_type},
      color = ${payload.color ?? null},
      icon = ${payload.icon ?? null},
      is_active = ${payload.is_active ?? true}
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING id, user_id, name, account_type, color, icon, is_active, created_at, updated_at
  `
  if (rows.length === 0) throw new HttpError(404, 'Account not found')
  return rows[0]
}

// En el modelo de fondo unico la cuenta es solo una etiqueta: borrarla no esta
// bloqueada por movimientos (transactions.account_id es ON DELETE SET NULL).
export async function deleteAccount(userId, id) {
  const rows = await sql`
    DELETE FROM public.accounts WHERE id = ${id} AND user_id = ${userId} RETURNING id
  `
  if (rows.length === 0) throw new HttpError(404, 'Account not found')
}
