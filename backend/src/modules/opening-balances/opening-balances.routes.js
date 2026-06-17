import { Router } from 'express'
import { asyncHandler } from '../../utils/async-handler.js'
import { validateBody } from '../../middleware/validate.js'
import { openingBalanceBodySchema } from './opening-balances.schema.js'
import { listOpeningBalances, upsertOpeningBalance } from './opening-balances.service.js'

const router = Router()

router.get('/', asyncHandler(async (req, res) => {
  res.json({ ok: true, data: await listOpeningBalances(req.auth.userId) })
}))

router.put('/', validateBody(openingBalanceBodySchema), asyncHandler(async (req, res) => {
  const { currency_code, amount } = req.validated.body
  const data = await upsertOpeningBalance(req.auth.userId, currency_code, amount)
  res.json({ ok: true, data })
}))

export default router
