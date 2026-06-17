import sql from '../../config/db.js'
import { HttpError } from '../../utils/http-error.js'

export function listCategories(userId) {
  return sql`
    SELECT id, user_id, name, created_at, updated_at
    FROM public.categories
    WHERE user_id = ${userId}
    ORDER BY name ASC
  `
}

export async function createCategory(userId, name) {
  const rows = await sql`
    INSERT INTO public.categories (user_id, name)
    VALUES (${userId}, ${name})
    RETURNING id, user_id, name, created_at, updated_at
  `
  return rows[0]
}

export async function updateCategory(userId, id, name) {
  const rows = await sql`
    UPDATE public.categories SET name = ${name}
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING id, user_id, name, created_at, updated_at
  `
  if (rows.length === 0) throw new HttpError(404, 'Category not found')
  return rows[0]
}

export async function deleteCategory(userId, id) {
  const rows = await sql`
    DELETE FROM public.categories WHERE id = ${id} AND user_id = ${userId} RETURNING id
  `
  if (rows.length === 0) throw new HttpError(404, 'Category not found')
}
