import { Router } from 'express'
import { asyncHandler } from '../../utils/async-handler.js'
import * as service from './dashboard.service.js'

const router = Router()

router.get('/balance-by-currency', asyncHandler(async (req, res) => {
  res.json({ ok: true, data: await service.balanceByCurrency(req.auth.userId) })
}))

router.get('/balances-summary', asyncHandler(async (req, res) => {
  res.json({ ok: true, data: await service.balancesSummary(req.auth.userId) })
}))

router.get('/spending-by-account', asyncHandler(async (req, res) => {
  res.json({ ok: true, data: await service.spendingByAccount(req.auth.userId) })
}))

router.get('/installment-progress', asyncHandler(async (req, res) => {
  res.json({ ok: true, data: await service.installmentProgress(req.auth.userId) })
}))

export default router
