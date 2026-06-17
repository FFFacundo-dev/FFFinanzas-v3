import sql from '../../config/db.js'

export function listAllowedUsers() {
  return sql`
    SELECT id, email, full_name, is_active, notes, created_at, updated_at
    FROM public.allowed_users
    ORDER BY email ASC
  `
}
