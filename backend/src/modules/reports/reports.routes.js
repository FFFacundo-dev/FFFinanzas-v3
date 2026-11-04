import { Router } from 'express'
import { asyncHandler } from '../../utils/async-handler.js'
import { validateQuery } from '../../middleware/validate.js'
import { monthlyCashflowQuerySchema, categoryBreakdownQuerySchema } from './reports.schema.js'
import * as controller from './reports.controller.js'

const router = Router()

router.get('/subscription-debt-by-category', asyncHandler(controller.subscriptionDebtByCategory))
router.get('/subscription-debt-by-account', asyncHandler(controller.subscriptionDebtByAccount))
router.get('/installment-debt-by-category', asyncHandler(controller.installmentDebtByCategory))
router.get('/installment-debt-by-account', asyncHandler(controller.installmentDebtByAccount))
router.get('/monthly-cashflow', validateQuery(monthlyCashflowQuerySchema), asyncHandler(controller.monthlyCashflow))
router.get('/category-breakdown', validateQuery(categoryBreakdownQuerySchema), asyncHandler(controller.categoryBreakdown))

export default router
