import 'dotenv/config'

// Centraliza carga y validacion de variables de entorno. Falla rapido si falta algo.
process.env.TZ = 'America/Argentina/Buenos_Aires'

function required(name) {
  const value = process.env[name]
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${name} is required in environment variables.`)
  }
  return value
}

function parseCorsOrigins(raw) {
  const origins = raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
  if (origins.length === 0) {
    throw new Error('CORS_ORIGIN must contain at least one valid origin.')
  }
  return origins
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT) || 3006,
  databaseUrl: required('DATABASE_URL'),
  corsOrigins: parseCorsOrigins(required('CORS_ORIGIN')),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  fx: {
    openErApiUrl: process.env.OPEN_ER_API_URL || 'https://open.er-api.com/v6/latest/ARS',
    coingeckoUrl: process.env.COINGECKO_RATES_URL || 'https://api.coingecko.com/api/v3/exchange_rates',
    ttlMs: Math.max(30_000, Number(process.env.EXCHANGE_RATES_TTL_MS || 5 * 60 * 1000))
  }
}
