import { Router } from 'express'
import { asyncHandler } from '../../utils/async-handler.js'
import { listCurrencies } from './currencies.service.js'

const router = Router()

router.get('/', asyncHandler(async (_req, res) => {
  res.json({ ok: true, data: await listCurrencies() })
}))

export default router
