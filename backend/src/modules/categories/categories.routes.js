import { Router } from 'express'
import { asyncHandler } from '../../utils/async-handler.js'
import { validateBody } from '../../middleware/validate.js'
import { categoryBodySchema } from './categories.schema.js'
import * as controller from './categories.controller.js'

const router = Router()

router.get('/', asyncHandler(controller.list))
router.post('/', validateBody(categoryBodySchema), asyncHandler(controller.create))
router.put('/:id', validateBody(categoryBodySchema), asyncHandler(controller.update))
router.delete('/:id', asyncHandler(controller.remove))

export default router
