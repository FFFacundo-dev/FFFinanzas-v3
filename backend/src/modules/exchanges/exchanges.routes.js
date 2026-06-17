import { Router } from 'express'
import { asyncHandler } from '../../utils/async-handler.js'
import { validateBody } from '../../middleware/validate.js'
import { exchangeBodySchema } from './exchanges.schema.js'
import { listExchanges, createExchange, deleteExchange } from './exchanges.service.js'

const router = Router()

router.get('/', asyncHandler(async (req, res) => {
  res.json({ ok: true, data: await listExchanges(req.auth.userId) })
}))

router.post('/', validateBody(exchangeBodySchema), asyncHandler(async (req, res) => {
  const data = await createExchange(req.auth.userId, req.validated.body)
  res.status(201).json({ ok: true, data })
}))

router.delete('/:id', asyncHandler(async (req, res) => {
  await deleteExchange(req.auth.userId, req.params.id)
  res.json({ ok: true })
}))

export default router
