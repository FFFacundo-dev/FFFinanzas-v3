import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { asyncHandler } from '../../utils/async-handler.js'
import { validateBody } from '../../middleware/validate.js'
import { requireAuth } from '../../middleware/require-auth.js'
import { loginSchema, registerSchema } from './auth.schema.js'
import { register, login, me } from './auth.controller.js'

const router = Router()

// Unicos endpoints que aceptan credenciales: los unicos que se pueden probar por
// fuerza bruta. /me queda afuera porque la app lo llama en cada carga.
// ponytail: contador en memoria; si algun dia corre en mas de una instancia, hace
// falta un store compartido (redis).
const credentialsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { ok: false, error: 'Demasiados intentos, probá de nuevo en un rato' }
})

router.post('/register', credentialsLimiter, validateBody(registerSchema), asyncHandler(register))
router.post('/login', credentialsLimiter, validateBody(loginSchema), asyncHandler(login))
router.get('/me', requireAuth, asyncHandler(me))

export default router
