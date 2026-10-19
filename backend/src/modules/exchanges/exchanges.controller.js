import * as service from './exchanges.service.js'

export async function list(req, res) {
  res.json({ ok: true, data: await service.listExchanges(req.auth.userId) })
}

export async function create(req, res) {
  const data = await service.createExchange(req.auth.userId, req.validated.body)
  res.status(201).json({ ok: true, data })
}

export async function remove(req, res) {
  await service.deleteExchange(req.auth.userId, req.params.id)
  res.json({ ok: true })
}
