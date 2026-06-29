// Convierte un monto entre monedas vía ARS usando el snapshot `ars_per_currency`.
// Display-only: si falta la tasa o la moneda coincide, devuelve el monto original.
export function convertViaArs(amount, from, to, arsPerCurrency) {
  const n = Number(amount)
  if (!arsPerCurrency || from === to) return n
  const rFrom = Number(arsPerCurrency[from])
  const rTo = Number(arsPerCurrency[to])
  if (!(rFrom > 0) || !(rTo > 0)) return n
  return (n * rFrom) / rTo
}
