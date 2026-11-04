import * as service from './installments.service.js'

export async function list(req, res) {
  res.json({ ok: true, data: await service.listInstallments(req.auth.userId) })
}

export async function create(req, res) {
  const data = await service.createInstallment(req.auth.userId, req.validated.body)
  res.status(201).json({ ok: true, data })
}

export async function update(req, res) {
  const data = await service.updateInstallment(req.auth.userId, req.params.id, req.validated.body)
  res.json({ ok: true, data })
}

export async function remove(req, res) {
  await service.deleteInstallment(req.auth.userId, req.params.id)
  res.json({ ok: true })
}

export async function listPayments(req, res) {
  res.json({ ok: true, data: await service.listInstallmentPayments(req.auth.userId) })
}

export async function createPayment(req, res) {
  const data = await service.createInstallmentPayment(req.auth.userId, req.validated.body)
  res.status(201).json({ ok: true, data })
}

export async function removePayment(req, res) {
  await service.deleteInstallmentPayment(req.auth.userId, req.params.id)
  res.json({ ok: true })
}

export async function listAdvancePayments(req, res) {
  res.json({ ok: true, data: await service.listInstallmentAdvancePayments(req.auth.userId) })
}

export async function createAdvancePayment(req, res) {
  const data = await service.createInstallmentAdvancePayment(req.auth.userId, req.validated.body)
  res.status(201).json({ ok: true, data })
}

export async function removeAdvancePayment(req, res) {
  await service.deleteInstallmentAdvancePayment(req.auth.userId, req.params.id)
  res.json({ ok: true })
}
