import bcrypt from 'bcryptjs'
import sql from '../../config/db.js'
import { HttpError } from '../../utils/http-error.js'
import { createAuthToken } from '../../middleware/require-auth.js'

export async function registerUser({ email, password, preferredLanguage }) {
  const normalizedEmail = email.toLowerCase()
  const language = String(preferredLanguage || 'es').slice(0, 10)

  const allowRow = await sql`
    SELECT id, is_active FROM public.allowed_users WHERE email = ${normalizedEmail} LIMIT 1
  `
  if (allowRow.length === 0 || !allowRow[0].is_active) {
    throw new HttpError(403, 'Email is not allowed to register')
  }

  const existing = await sql`SELECT id FROM public.users WHERE email = ${normalizedEmail} LIMIT 1`
  if (existing.length > 0) {
    throw new HttpError(409, 'User already exists')
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const inserted = await sql`
    INSERT INTO public.users (email, password_hash, preferred_language)
    VALUES (${normalizedEmail}, ${passwordHash}, ${language})
    RETURNING id, email, preferred_language, created_at
  `
  const user = inserted[0]
  const token = createAuthToken({ sub: String(user.id), userId: user.id, email: user.email })
  return { token, user }
}

export async function loginUser({ email, password }) {
  const normalizedEmail = email.toLowerCase()
  const rows = await sql`
    SELECT id, email, password_hash, preferred_language, created_at
    FROM public.users WHERE email = ${normalizedEmail} LIMIT 1
  `
  const user = rows[0]
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new HttpError(401, 'Invalid credentials')
  }

  const token = createAuthToken({ sub: String(user.id), userId: user.id, email: user.email })
  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      preferred_language: user.preferred_language,
      created_at: user.created_at
    }
  }
}

export async function getCurrentUser(userId) {
  const rows = await sql`
    SELECT id, email, preferred_language, created_at, updated_at
    FROM public.users WHERE id = ${userId} LIMIT 1
  `
  if (rows.length === 0) throw new HttpError(404, 'User not found')
  return rows[0]
}
