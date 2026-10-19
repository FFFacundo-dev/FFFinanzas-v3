import * as service from './budget.service.js'

// ── Presupuestos (varios por mes, con nombre) ──
export async function listBudgets(req, res) {
  res.json({ ok: true, data: await service.listBudgets(req.auth.userId) })
}

export async function createBudget(req, res) {
  const data = await service.createBudget(req.auth.userId, req.validated.body)
  res.status(201).json({ ok: true, data })
}

export async function duplicateBudget(req, res) {
  const data = await service.duplicateBudget(req.auth.userId, req.params.id)
  res.status(201).json({ ok: true, data })
}

export async function renameBudget(req, res) {
  const data = await service.renameBudget(req.auth.userId, req.params.id, req.validated.body.name)
  res.json({ ok: true, data })
}

export async function removeBudget(req, res) {
  await service.deleteBudget(req.auth.userId, req.params.id)
  res.json({ ok: true })
}

// ── Sueldo base ──
export async function getGeneralBaseIncome(req, res) {
  res.json({ ok: true, data: await service.getGeneralBaseIncome(req.auth.userId) })
}

// Sueldo base general (todos los presupuestos que no tengan override).
export async function setGeneralBaseIncome(req, res) {
  const data = await service.setGeneralBaseIncome(req.auth.userId, req.validated.body.amount)
  res.json({ ok: true, data })
}

// Sueldo base solo para este presupuesto (override; amount null lo limpia).
export async function setBudgetBaseIncome(req, res) {
  const data = await service.setBudgetBaseIncome(req.auth.userId, req.params.id, req.validated.body.amount)
  res.json({ ok: true, data })
}

// Ajustes de un gasto fijo (suscripción/cuota) solo en este presupuesto:
// incluirlo o no, y un monto hipotético que no toca el valor real.
export async function setBudgetFixedOverride(req, res) {
  const data = await service.setBudgetFixedOverride(
    req.auth.userId, req.params.id, req.params.sourceId, req.validated.body
  )
  res.json({ ok: true, data })
}

// ── Items del presupuesto ──
export async function listItems(req, res) {
  res.json({ ok: true, data: await service.listBudgetItems(req.auth.userId, req.query.budget_id) })
}

export async function createItem(req, res) {
  const data = await service.createBudgetItem(req.auth.userId, req.validated.body)
  res.status(201).json({ ok: true, data })
}

export async function updateItem(req, res) {
  const data = await service.updateBudgetItem(req.auth.userId, req.params.id, req.validated.body)
  res.json({ ok: true, data })
}

export async function removeItem(req, res) {
  await service.deleteBudgetItem(req.auth.userId, req.params.id)
  res.json({ ok: true })
}

// ── Resumen y ajustes ──
export async function getSummary(req, res) {
  res.json({ ok: true, data: await service.getBudgetSummary(req.auth.userId, req.query.budget_id) })
}

export async function getSettings(req, res) {
  res.json({ ok: true, data: await service.getBudgetSettings(req.auth.userId, req.query.period_month) })
}

export async function upsertSettings(req, res) {
  const data = await service.upsertBudgetSettings(req.auth.userId, req.validated.body)
  res.json({ ok: true, data })
}
