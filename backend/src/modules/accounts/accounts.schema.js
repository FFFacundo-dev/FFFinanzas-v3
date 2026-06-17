import { z } from 'zod'

export const accountBodySchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(100),
  account_type: z.enum(['BANK', 'DIGITAL', 'CASH']),
  color: z.string().trim().max(20).nullable().optional(),
  icon: z.string().trim().max(50).nullable().optional(),
  is_active: z.boolean().optional()
})
