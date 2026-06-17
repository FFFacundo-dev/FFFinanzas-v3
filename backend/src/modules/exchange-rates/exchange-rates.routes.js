import { Router } from 'express'
import { asyncHandler } from '../../utils/async-handler.js'
import { getExchangeRatesSnapshot } from '../../utils/exchange-rates.js'

const router = Router()

router.get('/', asyncHandler(async (_req, res) => {
  res.json({ ok: true, data: await getExchangeRatesSnapshot() })
}))

router.post('/refresh', asyncHandler(async (_req, res) => {
  res.json({ ok: true, data: await getExchangeRatesSnapshot({ forceRefresh: true }) })
}))

export default router
