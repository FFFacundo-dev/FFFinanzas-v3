import { Router } from 'express'
import { asyncHandler } from '../../utils/async-handler.js'
import { validateBody } from '../../middleware/validate.js'
import { installmentCreateSchema, installmentUpdateSchema } from './installments.schema.js'
import * as service from './installments.service.js'

const router = Router()

router.get('/', asyncHandler(async (req, res) => {
  res.json({ ok: true, data: await service.listInstallments(req.auth.userId) })
}))

router.post('/', validateBody(installmentCreateSchema), asyncHandler(async (req, res) => {
  res.status(201).json({ ok: true, data: await service.createInstallment(req.auth.userId, req.validated.body) })
}))

router.put('/:id', validateBody(installmentUpdateSchema), asyncHandler(async (req, res) => {
  res.json({ ok: true, data: await service.updateInstallment(req.auth.userId, req.params.id, req.validated.body) })
}))

router.delete('/:id', asyncHandler(async (req, res) => {
  await service.deleteInstallment(req.auth.userId, req.params.id)
  res.json({ ok: true })
}))

export default router
