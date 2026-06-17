import { Router } from 'express'
import { asyncHandler } from '../../utils/async-handler.js'
import { listAllowedUsers } from './allowed-users.service.js'

const router = Router()

router.get('/', asyncHandler(async (_req, res) => {
  res.json({ ok: true, data: await listAllowedUsers() })
}))

export default router
