import { Router } from 'express'
import { asyncHandler } from '../../utils/async-handler.js'
import { validateBody } from '../../middleware/validate.js'
import { installmentPaymentSchema } from './installments.schema.js'
import * as controller from './installments.controller.js'

const router = Router()

router.get('/', asyncHandler(controller.listPayments))
router.post('/', validateBody(installmentPaymentSchema), asyncHandler(controller.createPayment))
router.delete('/:id', asyncHandler(controller.removePayment))

export default router
