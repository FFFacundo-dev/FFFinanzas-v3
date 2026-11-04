import { Router } from 'express'
import { asyncHandler } from '../../utils/async-handler.js'
import { validateBody } from '../../middleware/validate.js'
import { openingBalanceBodySchema } from './opening-balances.schema.js'
import * as controller from './opening-balances.controller.js'

const router = Router()

router.get('/', asyncHandler(controller.list))
router.put('/', validateBody(openingBalanceBodySchema), asyncHandler(controller.upsert))

export default router
