import { Router } from 'express'
import { asyncHandler } from '../../utils/async-handler.js'
import { validateBody } from '../../middleware/validate.js'
import {
  createGoalSchema,
  updateGoalSchema,
  patchGoalSchema,
  goalMovementSchema
} from './goals.schema.js'
import * as controller from './goals.controller.js'

const router = Router()

router.get('/', asyncHandler(controller.list))
router.post('/', validateBody(createGoalSchema), asyncHandler(controller.create))
router.put('/:id', validateBody(updateGoalSchema), asyncHandler(controller.update))
router.patch('/:id', validateBody(patchGoalSchema), asyncHandler(controller.patchStatus))
router.delete('/:id', asyncHandler(controller.remove))

router.get('/:id/movements', asyncHandler(controller.listMovements))
router.post('/:id/movements', validateBody(goalMovementSchema), asyncHandler(controller.createMovement))

export default router
