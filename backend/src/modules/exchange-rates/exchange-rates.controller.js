import { getExchangeRatesSnapshot } from '../../utils/exchange-rates.js'

export async function get(_req, res) {
  res.json({ ok: true, data: await getExchangeRatesSnapshot() })
}
