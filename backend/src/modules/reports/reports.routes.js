import { Router } from 'express'
import { asyncHandler } from '../../utils/async-handler.js'
import { validateQuery } from '../../middleware/validate.js'
import { monthlyCashflowQuerySchema, categoryBreakdownQuerySchema } from './reports.schema.js'
import * as service from './reports.service.js'

const router = Router()

router.get('/subscription-debt-by-category', asyncHandler(async (req, res) => {
  res.json({ ok: true, data: await service.subscriptionDebtByCategory(req.auth.userId) })
}))

router.get('/subscription-debt-by-account', asyncHandler(async (req, res) => {
  res.json({ ok: true, data: await service.subscriptionDebtByAccount(req.auth.userId) })
}))

router.get('/installment-debt-by-category', asyncHandler(async (req, res) => {
  res.json({ ok: true, data: await service.installmentDebtByCategory(req.auth.userId) })
}))

router.get('/installment-debt-by-account', asyncHandler(async (req, res) => {
  res.json({ ok: true, data: await service.installmentDebtByAccount(req.auth.userId) })
}))

router.get('/monthly-cashflow', validateQuery(monthlyCashflowQuerySchema), asyncHandler(async (req, res) => {
  res.json({ ok: true, data: await service.monthlyCashflow(req.auth.userId, req.validated.query) })
}))

router.get('/category-breakdown', validateQuery(categoryBreakdownQuerySchema), asyncHandler(async (req, res) => {
  const { data, meta } = await service.categoryBreakdown(req.auth.userId, req.validated.query)
  res.json({ ok: true, data, meta })
}))

export default router
