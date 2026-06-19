import { z } from 'zod'

export const createGoalSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(120),
  target_amount: z.coerce.number().positive(),
  currency_code: z.string().trim().min(1).max(10),
  deadline: z.string().date().nullable().optional()
})

// La moneda no se edita (los movimientos heredan la moneda de la meta).
export const updateGoalSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(120),
  target_amount: z.coerce.number().positive(),
  deadline: z.string().date().nullable().optional()
})

export const patchGoalSchema = z.object({
  status: z.enum(['ACTIVE', 'ARCHIVED'])
})

// La fecha no viene del cliente: la pone el server (CURRENT_DATE).
export const goalMovementSchema = z.object({
  movement_type: z.enum(['ALLOCATE', 'RELEASE']),
  amount: z.coerce.number().positive()
})
