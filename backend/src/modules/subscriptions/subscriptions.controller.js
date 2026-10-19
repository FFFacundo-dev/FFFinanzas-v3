import * as service from './subscriptions.service.js'

export async function list(req, res) {
  res.json({ ok: true, data: await service.listSubscriptions(req.auth.userId) })
}

export async function create(req, res) {
  const data = await service.createSubscription(req.auth.userId, req.validated.body)
  res.status(201).json({ ok: true, data })
}

export async function update(req, res) {
  const data = await service.updateSubscription(req.auth.userId, req.params.id, req.validated.body)
  res.json({ ok: true, data })
}

export async function remove(req, res) {
  await service.deleteSubscription(req.auth.userId, req.params.id)
  res.json({ ok: true })
}

export async function listPayments(req, res) {
  res.json({ ok: true, data: await service.listSubscriptionPayments(req.auth.userId) })
}

export async function createPayment(req, res) {
  const data = await service.createSubscriptionPayment(req.auth.userId, req.validated.body)
  res.status(201).json({ ok: true, data })
}

export async function removePayment(req, res) {
  await service.deleteSubscriptionPayment(req.auth.userId, req.params.id)
  res.json({ ok: true })
}
