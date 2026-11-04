import { Router } from 'express'
import { asyncHandler } from '../../utils/async-handler.js'
import { validateBody } from '../../middleware/validate.js'
import {
  budgetItemSchema,
  budgetSettingsSchema,
  budgetSchema,
  budgetRenameSchema,
  generalBaseIncomeSchema,
  budgetBaseIncomeSchema,
  budgetFixedOverrideSchema
} from './budget.schema.js'
import * as controller from './budget.controller.js'

const router = Router()

router.get('/budgets', asyncHandler(controller.listBudgets))
router.post('/budgets', validateBody(budgetSchema), asyncHandler(controller.createBudget))
router.post('/budgets/:id/duplicate', asyncHandler(controller.duplicateBudget))

router.get('/base-income', asyncHandler(controller.getGeneralBaseIncome))
router.put('/base-income', validateBody(generalBaseIncomeSchema), asyncHandler(controller.setGeneralBaseIncome))
router.put('/budgets/:id/base-income', validateBody(budgetBaseIncomeSchema), asyncHandler(controller.setBudgetBaseIncome))
router.put('/budgets/:id/fixed/:sourceId', validateBody(budgetFixedOverrideSchema), asyncHandler(controller.setBudgetFixedOverride))

// Va despues de las rutas mas especificas de /budgets/:id/... a proposito.
router.put('/budgets/:id', validateBody(budgetRenameSchema), asyncHandler(controller.renameBudget))
router.delete('/budgets/:id', asyncHandler(controller.removeBudget))

router.get('/items', asyncHandler(controller.listItems))
router.post('/items', validateBody(budgetItemSchema), asyncHandler(controller.createItem))
router.put('/items/:id', validateBody(budgetItemSchema), asyncHandler(controller.updateItem))
router.delete('/items/:id', asyncHandler(controller.removeItem))

router.get('/summary', asyncHandler(controller.getSummary))

router.get('/settings', asyncHandler(controller.getSettings))
router.post('/settings', validateBody(budgetSettingsSchema), asyncHandler(controller.upsertSettings))

export default router
