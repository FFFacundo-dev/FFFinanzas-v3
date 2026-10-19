import { Router } from 'express'
import { asyncHandler } from '../../utils/async-handler.js'
import { validateBody } from '../../middleware/validate.js'
import { exchangeBodySchema } from './exchanges.schema.js'
import * as controller from './exchanges.controller.js'

const router = Router()

router.get('/', asyncHandler(controller.list))
router.post('/', validateBody(exchangeBodySchema), asyncHandler(controller.create))
router.delete('/:id', asyncHandler(controller.remove))

export default router
