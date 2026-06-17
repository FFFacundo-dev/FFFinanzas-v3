import { Router } from 'express'
import { asyncHandler } from '../../utils/async-handler.js'
import { validateBody } from '../../middleware/validate.js'
import { installmentAdvanceSchema } from './installments.schema.js'
import * as service from './installments.service.js'

const router = Router()

router.get('/', asyncHandler(async (req, res) => {
  res.json({ ok: true, data: await service.listInstallmentAdvancePayments(req.auth.userId) })
}))

router.post('/', validateBody(installmentAdvanceSchema), asyncHandler(async (req, res) => {
  res.status(201).json({ ok: true, data: await service.createInstallmentAdvancePayment(req.auth.userId, req.validated.body) })
}))

router.delete('/:id', asyncHandler(async (req, res) => {
  await service.deleteInstallmentAdvancePayment(req.auth.userId, req.params.id)
  res.json({ ok: true })
}))

export default router
