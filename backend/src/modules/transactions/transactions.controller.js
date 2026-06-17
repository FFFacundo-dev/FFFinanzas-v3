import * as service from './transactions.service.js'

export async function list(req, res) {
  const { rows, total } = await service.listTransactions(req.auth.userId, req.validated.query)
  res.json({ ok: true, data: rows, meta: { total, limit: req.validated.query.limit, offset: req.validated.query.offset } })
}

export async function create(req, res) {
  const data = await service.createTransaction(req.auth.userId, req.validated.body)
  res.status(201).json({ ok: true, data })
}

export async function replace(req, res) {
  const data = await service.updateTransaction(req.auth.userId, req.params.id, req.validated.body, { isPartial: false })
  res.json({ ok: true, data })
}

export async function patch(req, res) {
  const data = await service.updateTransaction(req.auth.userId, req.params.id, req.validated.body, { isPartial: true })
  res.json({ ok: true, data })
}

export async function remove(req, res) {
  await service.deleteTransaction(req.auth.userId, req.params.id)
  res.json({ ok: true })
}
