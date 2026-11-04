import { Router } from 'express'
import { asyncHandler } from '../../utils/async-handler.js'
import { validateBody } from '../../middleware/validate.js'
import { installmentCreateSchema, installmentUpdateSchema } from './installments.schema.js'
import * as controller from './installments.controller.js'

const router = Router()

router.get('/', asyncHandler(controller.list))
router.post('/', validateBody(installmentCreateSchema), asyncHandler(controller.create))
router.put('/:id', validateBody(installmentUpdateSchema), asyncHandler(controller.update))
router.delete('/:id', asyncHandler(controller.remove))

export default router
