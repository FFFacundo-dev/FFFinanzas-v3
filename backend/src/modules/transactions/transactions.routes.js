import { Router } from 'express'
import { asyncHandler } from '../../utils/async-handler.js'
import { validateBody, validateQuery } from '../../middleware/validate.js'
import { transactionsQuerySchema, transactionBodySchema, partialTransactionBodySchema } from './transactions.schema.js'
import * as controller from './transactions.controller.js'

const router = Router()

router.get('/', validateQuery(transactionsQuerySchema), asyncHandler(controller.list))
router.post('/', validateBody(transactionBodySchema), asyncHandler(controller.create))
router.put('/:id', validateBody(transactionBodySchema), asyncHandler(controller.replace))
router.patch('/:id', validateBody(partialTransactionBodySchema), asyncHandler(controller.patch))
router.delete('/:id', asyncHandler(controller.remove))

export default router
