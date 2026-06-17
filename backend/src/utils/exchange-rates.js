import { env } from '../config/env.js'

// Snapshot FX en "ARS por moneda" con cache de 5 min. Fuente primaria open.er-api,
// fallback CoinGecko, y hard fallback final. Portado de v2.

const HARD_FALLBACK_RATES = { ARS: 1, USD: 1600, USDT: 1600 }

let ratesCache = { snapshot: null, expiresAt: 0 }

function normalizeCode(code) {
  return String(code || '').trim().toUpperCase()
}

function fallbackSnapshot(reason = 'Fallback snapshot') {
  return {
    source: 'fallback',
    updated_at: new Date().toISOString(),
    stale: true,
    from_cache: false,
    warning: reason,
    ars_per_currency: { ...HARD_FALLBACK_RATES }
  }
}

function buildArsPerCurrencyFromOpenErApi(ratesFromArs) {
  const arsPerCurrency = { ...HARD_FALLBACK_RATES }
  Object.entries(ratesFromArs || {}).forEach(([code, valueFromArs]) => {
    const normalizedCode = normalizeCode(code)
    const amountFromArs = Number(valueFromArs)
    if (!normalizedCode || !Number.isFinite(amountFromArs) || amountFromArs <= 0) return
    if (normalizedCode === 'ARS') {
      arsPerCurrency.ARS = 1
      return
    }
    arsPerCurrency[normalizedCode] = Number((1 / amountFromArs).toFixed(6))
  })
  return arsPerCurrency
}

function buildArsPerCurrencyFromCoinGecko(ratesByBtc) {
  const arsPerBtc = Number(ratesByBtc?.ARS)
  if (!Number.isFinite(arsPerBtc) || arsPerBtc <= 0) return { ...HARD_FALLBACK_RATES }
  const arsPerCurrency = { ...HARD_FALLBACK_RATES }
  Object.entries(ratesByBtc).forEach(([code, valuePerBtc]) => {
    const amountPerBtc = Number(valuePerBtc)
    if (!Number.isFinite(amountPerBtc) || amountPerBtc <= 0) return
    arsPerCurrency[normalizeCode(code)] = arsPerBtc / amountPerBtc
  })
  arsPerCurrency.ARS = 1
  return arsPerCurrency
}

async function fetchOpenErApiSnapshot() {
  const response = await fetch(env.fx.openErApiUrl, { method: 'GET', headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`open.er-api failed with status ${response.status}`)
  const payload = await response.json()
  const rawRates = payload?.rates
  if (!rawRates || typeof rawRates !== 'object') throw new Error('open.er-api response does not include rates')
  const arsPerCurrency = buildArsPerCurrencyFromOpenErApi(rawRates)
  if (!Number.isFinite(arsPerCurrency.ARS) || arsPerCurrency.ARS <= 0) throw new Error('ARS rate missing in open.er-api payload')
  return { source: 'open.er-api', updated_at: new Date().toISOString(), stale: false, from_cache: false, ars_per_currency: arsPerCurrency }
}

async function fetchCoinGeckoSnapshot() {
  const response = await fetch(env.fx.coingeckoUrl, { method: 'GET', headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`CoinGecko exchange rates failed with status ${response.status}`)
  const payload = await response.json()
  const rawRates = payload?.rates
  if (!rawRates || typeof rawRates !== 'object') throw new Error('CoinGecko response does not include rates')
  const ratesByBtc = {}
  Object.entries(rawRates).forEach(([code, entry]) => {
    const normalizedCode = normalizeCode(code)
    const value = Number(entry?.value)
    if (!normalizedCode || !Number.isFinite(value) || value <= 0) return
    ratesByBtc[normalizedCode] = value
  })
  const arsPerCurrency = buildArsPerCurrencyFromCoinGecko(ratesByBtc)
  if (!Number.isFinite(arsPerCurrency.ARS) || arsPerCurrency.ARS <= 0) throw new Error('ARS rate missing in CoinGecko payload')
  return { source: 'coingecko', updated_at: new Date().toISOString(), stale: false, from_cache: false, ars_per_currency: arsPerCurrency }
}

export async function getExchangeRatesSnapshot({ forceRefresh = false } = {}) {
  const now = Date.now()
  if (!forceRefresh && ratesCache.snapshot && now < ratesCache.expiresAt) {
    return { ...ratesCache.snapshot, from_cache: true }
  }

  try {
    const snapshot = await fetchOpenErApiSnapshot()
    ratesCache = { snapshot, expiresAt: now + env.fx.ttlMs }
    return snapshot
  } catch (_error) {
    // sigue al proveedor secundario
  }

  try {
    const snapshot = await fetchCoinGeckoSnapshot()
    ratesCache = { snapshot, expiresAt: now + env.fx.ttlMs }
    return snapshot
  } catch (error) {
    if (ratesCache.snapshot) {
      return { ...ratesCache.snapshot, stale: true, from_cache: true, warning: error.message }
    }
    return fallbackSnapshot(error.message)
  }
}

export function toWeightedArsAmount(amount, currencyCode, ratesSnapshot) {
  const numericAmount = Number(amount || 0)
  const normalizedCurrency = normalizeCode(currencyCode || 'ARS') || 'ARS'
  const rate = Number(ratesSnapshot?.ars_per_currency?.[normalizedCurrency])

  if (!Number.isFinite(numericAmount) || !Number.isFinite(rate) || rate <= 0) {
    return {
      weighted_amount_ars: null,
      conversion_rate_to_ars: null,
      conversion_available: false,
      conversion_currency: normalizedCurrency
    }
  }

  return {
    weighted_amount_ars: Number((numericAmount * rate).toFixed(2)),
    conversion_rate_to_ars: Number(rate.toFixed(6)),
    conversion_available: true,
    conversion_currency: normalizedCurrency
  }
}
