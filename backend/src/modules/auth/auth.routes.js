import { Router } from 'express'
import { asyncHandler } from '../../utils/async-handler.js'
import { validateBody } from '../../middleware/validate.js'
import { requireAuth } from '../../middleware/require-auth.js'
import { loginSchema, registerSchema } from './auth.schema.js'
import { register, login, me } from './auth.controller.js'

const router = Router()

router.post('/register', validateBody(registerSchema), asyncHandler(register))
router.post('/login', validateBody(loginSchema), asyncHandler(login))
router.get('/me', requireAuth, asyncHandler(me))

export default router
