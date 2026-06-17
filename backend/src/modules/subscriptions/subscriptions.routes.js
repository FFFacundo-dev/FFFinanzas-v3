import { Router } from 'express'
import { asyncHandler } from '../../utils/async-handler.js'
import { validateBody } from '../../middleware/validate.js'
import { subscriptionBodySchema } from './subscriptions.schema.js'
import * as service from './subscriptions.service.js'

const router = Router()

router.get('/', asyncHandler(async (req, res) => {
  res.json({ ok: true, data: await service.listSubscriptions(req.auth.userId) })
}))

router.post('/', validateBody(subscriptionBodySchema), asyncHandler(async (req, res) => {
  res.status(201).json({ ok: true, data: await service.createSubscription(req.auth.userId, req.validated.body) })
}))

router.put('/:id', validateBody(subscriptionBodySchema), asyncHandler(async (req, res) => {
  res.json({ ok: true, data: await service.updateSubscription(req.auth.userId, req.params.id, req.validated.body) })
}))

router.delete('/:id', asyncHandler(async (req, res) => {
  await service.deleteSubscription(req.auth.userId, req.params.id)
  res.json({ ok: true })
}))

export default router
