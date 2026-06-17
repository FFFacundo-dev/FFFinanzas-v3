import { Router } from 'express'
import { asyncHandler } from '../../utils/async-handler.js'
import { validateBody } from '../../middleware/validate.js'
import { subscriptionPaymentBodySchema } from './subscriptions.schema.js'
import * as service from './subscriptions.service.js'

const router = Router()

router.get('/', asyncHandler(async (req, res) => {
  res.json({ ok: true, data: await service.listSubscriptionPayments(req.auth.userId) })
}))

router.post('/', validateBody(subscriptionPaymentBodySchema), asyncHandler(async (req, res) => {
  res.status(201).json({ ok: true, data: await service.createSubscriptionPayment(req.auth.userId, req.validated.body) })
}))

router.delete('/:id', asyncHandler(async (req, res) => {
  await service.deleteSubscriptionPayment(req.auth.userId, req.params.id)
  res.json({ ok: true })
}))

export default router
