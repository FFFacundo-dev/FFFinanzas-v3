import { randomUUID } from 'node:crypto'
import { env } from '../config/env.js'
import { HttpError } from '../utils/http-error.js'

const UNIQUE_CONSTRAINT_MESSAGES = {
  subscription_payments_unique_period: 'Subscription payment for this month already exists',
  installment_payments_unique_number: 'Installment payment for that installment number already exists',
  accounts_user_name_unique: 'An account with that name already exists',
  categories_user_name_unique: 'A category with that name already exists'
}

export function errorHandler(err, req, res, _next) {
  const requestId = req.requestId || randomUUID()

  if (err instanceof HttpError) {
    return res.status(err.status).json({
      ok: false,
      error: err.message,
      requestId,
      details: err.details ?? undefined
    })
  }

  if (err?.code === '23505') {
    return res.status(409).json({
      ok: false,
      error: UNIQUE_CONSTRAINT_MESSAGES[err?.constraint] || 'Duplicate value violates unique constraint',
      requestId
    })
  }

  if (err?.code === '23503') {
    return res.status(400).json({ ok: false, error: 'Invalid reference to related entity', requestId })
  }

  if (err?.code === '23514') {
    return res.status(400).json({ ok: false, error: 'A value violates a database constraint', requestId })
  }

  if (err?.code === '22P02') {
    return res.status(400).json({ ok: false, error: 'Invalid input format', requestId })
  }

  console.error('[Unhandled error]', {
    requestId,
    method: req.method,
    path: req.originalUrl,
    message: err?.message,
    code: err?.code,
    stack: err?.stack
  })

  return res.status(500).json({
    ok: false,
    error: 'Internal server error',
    requestId,
    details: env.isProduction ? undefined : { code: err?.code || null, message: err?.message || 'Unknown error' }
  })
}
