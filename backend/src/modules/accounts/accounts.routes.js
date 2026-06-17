import { Router } from 'express'
import { asyncHandler } from '../../utils/async-handler.js'
import { validateBody } from '../../middleware/validate.js'
import { accountBodySchema } from './accounts.schema.js'
import * as controller from './accounts.controller.js'

const router = Router()

router.get('/', asyncHandler(controller.list))
router.post('/', validateBody(accountBodySchema), asyncHandler(controller.create))
router.put('/:id', validateBody(accountBodySchema), asyncHandler(controller.update))
router.delete('/:id', asyncHandler(controller.remove))

export default router
