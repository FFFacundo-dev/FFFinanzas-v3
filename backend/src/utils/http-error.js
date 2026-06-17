export class HttpError extends Error {
  constructor(status, message, details = null) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.details = details
  }
}

export function assertRequired(fields, payload) {
  const missing = fields.filter((field) => {
    const value = payload[field]
    return value === undefined || value === null || value === ''
  })
  if (missing.length > 0) {
    throw new HttpError(400, `Missing required fields: ${missing.join(', ')}`)
  }
}

export function toInt(value, fallback = null) {
  if (value === undefined || value === null || value === '') return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? fallback : parsed
}

export function toPositiveNumber(value, fieldName) {
  const num = Number(value)
  if (!Number.isFinite(num) || num <= 0) {
    throw new HttpError(400, `${fieldName} must be a positive number`)
  }
  return num
}
