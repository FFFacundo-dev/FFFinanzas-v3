import { Router } from 'express'
import { asyncHandler } from '../../utils/async-handler.js'
import { validateBody } from '../../middleware/validate.js'
import { budgetItemSchema, budgetSettingsSchema, budgetSchema, budgetRenameSchema, generalBaseIncomeSchema, budgetBaseIncomeSchema } from './budget.schema.js'
import * as service from './budget.service.js'

const router = Router()

// ── Presupuestos (varios por mes, con nombre) ──
router.get('/budgets', asyncHandler(async (req, res) => {
  const data = await service.listBudgets(req.auth.userId)
  res.json({ ok: true, data })
}))

router.post('/budgets', validateBody(budgetSchema), asyncHandler(async (req, res) => {
  res.status(201).json({ ok: true, data: await service.createBudget(req.auth.userId, req.validated.body) })
}))

router.post('/budgets/:id/duplicate', asyncHandler(async (req, res) => {
  res.status(201).json({ ok: true, data: await service.duplicateBudget(req.auth.userId, req.params.id) })
}))

// Sueldo base general (todos los presupuestos que no tengan override).
router.put('/base-income', validateBody(generalBaseIncomeSchema), asyncHandler(async (req, res) => {
  res.json({ ok: true, data: await service.setGeneralBaseIncome(req.auth.userId, req.validated.body.amount) })
}))

// Sueldo base solo para este presupuesto (override; amount null lo limpia).
router.put('/budgets/:id/base-income', validateBody(budgetBaseIncomeSchema), asyncHandler(async (req, res) => {
  res.json({ ok: true, data: await service.setBudgetBaseIncome(req.auth.userId, req.params.id, req.validated.body.amount) })
}))

router.put('/budgets/:id', validateBody(budgetRenameSchema), asyncHandler(async (req, res) => {
  res.json({ ok: true, data: await service.renameBudget(req.auth.userId, req.params.id, req.validated.body.name) })
}))

router.delete('/budgets/:id', asyncHandler(async (req, res) => {
  await service.deleteBudget(req.auth.userId, req.params.id)
  res.json({ ok: true })
}))

router.get('/items', asyncHandler(async (req, res) => {
  const data = await service.listBudgetItems(req.auth.userId, req.query.budget_id)
  res.json({ ok: true, data })
}))

router.post('/items', validateBody(budgetItemSchema), asyncHandler(async (req, res) => {
  res.status(201).json({ ok: true, data: await service.createBudgetItem(req.auth.userId, req.validated.body) })
}))

router.put('/items/:id', validateBody(budgetItemSchema), asyncHandler(async (req, res) => {
  res.json({ ok: true, data: await service.updateBudgetItem(req.auth.userId, req.params.id, req.validated.body) })
}))

router.delete('/items/:id', asyncHandler(async (req, res) => {
  await service.deleteBudgetItem(req.auth.userId, req.params.id)
  res.json({ ok: true })
}))

router.get('/summary', asyncHandler(async (req, res) => {
  const data = await service.getBudgetSummary(req.auth.userId, req.query.budget_id)
  res.json({ ok: true, data })
}))

router.get('/settings', asyncHandler(async (req, res) => {
  const data = await service.getBudgetSettings(req.auth.userId, req.query.period_month)
  res.json({ ok: true, data })
}))

router.post('/settings', validateBody(budgetSettingsSchema), asyncHandler(async (req, res) => {
  res.json({ ok: true, data: await service.upsertBudgetSettings(req.auth.userId, req.validated.body) })
}))

export default router
