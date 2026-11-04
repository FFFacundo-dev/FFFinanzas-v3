import * as service from './currencies.service.js'

export async function list(_req, res) {
  res.json({ ok: true, data: await service.listCurrencies() })
}
