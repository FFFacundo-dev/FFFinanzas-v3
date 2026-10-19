import * as service from './opening-balances.service.js'

export async function list(req, res) {
  res.json({ ok: true, data: await service.listOpeningBalances(req.auth.userId) })
}

export async function upsert(req, res) {
  const { currency_code, amount } = req.validated.body
  const data = await service.upsertOpeningBalance(req.auth.userId, currency_code, amount)
  res.json({ ok: true, data })
}
