// Self-check de formato de montos. Correr: node src/lib/format.check.mjs
import assert from 'node:assert'
import { formatThousands, parseAmountInput } from './format.js'

// formato para mostrar
assert.equal(formatThousands('1000000'), '1.000.000')
assert.equal(formatThousands('1000000.5'), '1.000.000,5')
assert.equal(formatThousands('1000.'), '1.000,') // coma a medio tipear se conserva
assert.equal(formatThousands(''), '')
assert.equal(formatThousands('0'), '0')

// limpieza para el backend
assert.equal(parseAmountInput('1.000.000'), '1000000')
assert.equal(parseAmountInput('1.000.000,50'), '1000000.50')
assert.equal(parseAmountInput('1000,'), '1000.')
assert.equal(parseAmountInput('007'), '7')
assert.equal(parseAmountInput(''), '')

// roundtrip: lo limpio sigue siendo numérico
assert.equal(Number(parseAmountInput('1.234.567,89')), 1234567.89)

// negativos (ej. saldo de apertura en deuda)
assert.equal(parseAmountInput('-1.000'), '-1000')
assert.equal(formatThousands('-1000'), '-1.000')
assert.equal(parseAmountInput('-'), '') // solo el signo todavía no es número

console.log('ok')
