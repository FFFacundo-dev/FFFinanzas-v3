import { Router } from 'express'
import { asyncHandler } from '../../utils/async-handler.js'
import * as controller from './exchange-rates.controller.js'

const router = Router()

router.get('/', asyncHandler(controller.get))

export default router
