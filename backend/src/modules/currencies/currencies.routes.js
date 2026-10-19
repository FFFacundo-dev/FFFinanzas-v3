import { Router } from 'express'
import { asyncHandler } from '../../utils/async-handler.js'
import * as controller from './currencies.controller.js'

const router = Router()

router.get('/', asyncHandler(controller.list))

export default router
