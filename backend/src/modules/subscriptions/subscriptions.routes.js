import { Router } from 'express'
import { asyncHandler } from '../../utils/async-handler.js'
import { validateBody } from '../../middleware/validate.js'
import { subscriptionBodySchema } from './subscriptions.schema.js'
import * as controller from './subscriptions.controller.js'

const router = Router()

router.get('/', asyncHandler(controller.list))
router.post('/', validateBody(subscriptionBodySchema), asyncHandler(controller.create))
router.put('/:id', validateBody(subscriptionBodySchema), asyncHandler(controller.update))
router.delete('/:id', asyncHandler(controller.remove))

export default router
