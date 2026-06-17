import { z } from 'zod'

export const monthlyCashflowQuerySchema = z.object({
  date_from: z.string().date().optional(),
  date_to: z.string().date().optional(),
  account_id: z.string().uuid().optional()
})

export const categoryBreakdownQuerySchema = z.object({
  date_from: z.string().date().optional(),
  date_to: z.string().date().optional(),
  account_id: z.string().uuid().optional(),
  movement_type: z.enum(['EXPENSE', 'INCOME']).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0)
})
