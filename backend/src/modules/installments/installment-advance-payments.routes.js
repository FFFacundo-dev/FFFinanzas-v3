import { Router } from 'express'
import { asyncHandler } from '../../utils/async-handler.js'
import { validateBody } from '../../middleware/validate.js'
import { installmentAdvanceSchema } from './installments.schema.js'
import * as controller from './installments.controller.js'

const router = Router()

router.get('/', asyncHandler(controller.listAdvancePayments))
router.post('/', validateBody(installmentAdvanceSchema), asyncHandler(controller.createAdvancePayment))
router.delete('/:id', asyncHandler(controller.removeAdvancePayment))

export default router
