import * as service from './goals.service.js'

export async function list(req, res) {
  res.json({ ok: true, data: await service.listGoals(req.auth.userId, req.query.status) })
}

export async function create(req, res) {
  const data = await service.createGoal(req.auth.userId, req.validated.body)
  res.status(201).json({ ok: true, data })
}

export async function update(req, res) {
  const data = await service.updateGoal(req.auth.userId, req.params.id, req.validated.body)
  res.json({ ok: true, data })
}

export async function patchStatus(req, res) {
  const data = await service.patchGoalStatus(req.auth.userId, req.params.id, req.validated.body.status)
  res.json({ ok: true, data })
}

export async function remove(req, res) {
  await service.deleteGoal(req.auth.userId, req.params.id)
  res.json({ ok: true })
}

export async function listMovements(req, res) {
  res.json({ ok: true, data: await service.listGoalMovements(req.auth.userId, req.params.id) })
}

export async function createMovement(req, res) {
  const data = await service.createGoalMovement(req.auth.userId, req.params.id, req.validated.body)
  res.status(201).json({ ok: true, data })
}
