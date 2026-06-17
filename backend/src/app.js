import cors from 'cors'
import express from 'express'
import { env } from './config/env.js'
import { requestContextMiddleware } from './middleware/request-context.js'
import { notFoundHandler } from './middleware/not-found.js'
import { errorHandler } from './middleware/error-handler.js'
import authRoutes from './modules/auth/auth.routes.js'
import apiRouter from './routes/index.js'

export function createApp() {
  const app = express()

  app.use(cors({ origin: env.corsOrigins }))
  app.use(requestContextMiddleware)
  app.use(express.json())

  app.get('/health', (_req, res) => {
    res.status(200).json({ ok: true, service: 'fffinanzas-v3-backend', timestamp: new Date().toISOString() })
  })

  // Auth va aparte (no requiere token); el resto cuelga de /api con requireAuth.
  app.use('/api/auth', authRoutes)
  app.use('/api', apiRouter)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
