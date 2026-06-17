import * as service from './accounts.service.js'

export async function list(req, res) {
  res.json({ ok: true, data: await service.listAccounts(req.auth.userId) })
}

export async function create(req, res) {
  const data = await service.createAccount(req.auth.userId, req.validated.body)
  res.status(201).json({ ok: true, data })
}

export async function update(req, res) {
  const data = await service.updateAccount(req.auth.userId, req.params.id, req.validated.body)
  res.json({ ok: true, data })
}

export async function remove(req, res) {
  await service.deleteAccount(req.auth.userId, req.params.id)
  res.json({ ok: true })
}
