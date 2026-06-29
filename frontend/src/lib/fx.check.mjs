// Self-check de conversión FX. Correr: node src/lib/fx.check.mjs
import assert from 'node:assert'
import { convertViaArs } from './fx.js'

const ars = { ARS: 1, USD: 1000, EUR: 1100 }

assert.equal(convertViaArs(1, 'USD', 'ARS', ars), 1000) // a ARS
assert.equal(convertViaArs(1000, 'ARS', 'USD', ars), 1) // de ARS
assert.equal(convertViaArs(5, 'USD', 'USD', ars), 5) // misma moneda
assert.equal(convertViaArs(5, 'USD', 'GBP', ars), 5) // sin tasa destino → original
assert.equal(convertViaArs(5, 'USD', 'ARS', null), 5) // sin snapshot → original
// cruce vía ARS: 1 USD = 1000 ARS = 1000/1100 EUR
assert.ok(Math.abs(convertViaArs(1, 'USD', 'EUR', ars) - 1000 / 1100) < 1e-9)

console.log('ok')
