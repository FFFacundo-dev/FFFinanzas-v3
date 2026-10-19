import { Router } from 'express'
import { asyncHandler } from '../../utils/async-handler.js'
import { validateBody } from '../../middleware/validate.js'
import { subscriptionPaymentBodySchema } from './subscriptions.schema.js'
import * as controller from './subscriptions.controller.js'

const router = Router()

router.get('/', asyncHandler(controller.listPayments))
router.post('/', validateBody(subscriptionPaymentBodySchema), asyncHandler(controller.createPayment))
router.delete('/:id', asyncHandler(controller.removePayment))

export default router
