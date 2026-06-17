import { Router } from 'express'
import { asyncHandler } from '../../utils/async-handler.js'
import { validateBody } from '../../middleware/validate.js'
import { installmentPaymentSchema } from './installments.schema.js'
import * as service from './installments.service.js'

const router = Router()

router.get('/', asyncHandler(async (req, res) => {
  res.json({ ok: true, data: await service.listInstallmentPayments(req.auth.userId) })
}))

router.post('/', validateBody(installmentPaymentSchema), asyncHandler(async (req, res) => {
  res.status(201).json({ ok: true, data: await service.createInstallmentPayment(req.auth.userId, req.validated.body) })
}))

router.delete('/:id', asyncHandler(async (req, res) => {
  await service.deleteInstallmentPayment(req.auth.userId, req.params.id)
  res.json({ ok: true })
}))

export default router
