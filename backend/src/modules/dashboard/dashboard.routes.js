import { Router } from 'express'
import { asyncHandler } from '../../utils/async-handler.js'
import * as controller from './dashboard.controller.js'

const router = Router()

router.get('/balance-by-currency', asyncHandler(controller.balanceByCurrency))
router.get('/balances-summary', asyncHandler(controller.balancesSummary))
router.get('/spending-by-account', asyncHandler(controller.spendingByAccount))
router.get('/installment-progress', asyncHandler(controller.installmentProgress))

export default router
