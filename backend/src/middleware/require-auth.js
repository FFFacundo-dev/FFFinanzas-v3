import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { HttpError } from '../utils/http-error.js'

function resolveUserIdFromClaims(payload) {
  return payload?.userId ?? payload?.user_id ?? payload?.id ?? payload?.sub ?? null
}

export function createAuthToken(payload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn })
}

export function requireAuth(req, _res, next) {
  const header = req.headers.authorization || ''
  const [type, token] = header.split(' ')

  if (type !== 'Bearer' || !token) {
    return next(new HttpError(401, 'Authorization token is required'))
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret)
    const userId = resolveUserIdFromClaims(payload)
    if (!userId) {
      return next(new HttpError(401, 'Invalid token payload: missing user id'))
    }
    req.auth = { userId: Number(userId), payload }
    return next()
  } catch (_error) {
    return next(new HttpError(401, 'Invalid or expired token'))
  }
}
