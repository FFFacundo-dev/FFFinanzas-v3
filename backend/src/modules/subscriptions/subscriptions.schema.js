import { z } from 'zod'

export const subscriptionBodySchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio'),
  description: z.string().trim().max(500).nullable().optional(),
  currency_code: z.string().trim().max(10).optional().default('ARS'),
  default_amount: z.coerce.number().positive().nullable().optional(),
  account_id: z.string().uuid().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  billing_day: z.coerce.number().int().min(0).max(31).nullable().optional(),
  start_date: z.string().date().nullable().optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'CANCELLED']).optional().default('ACTIVE')
})

export const subscriptionPaymentBodySchema = z.object({
  subscription_id: z.string().uuid(),
  account_id: z.string().uuid().nullable().optional(),
  amount: z.coerce.number().positive(),
  payment_date: z.string().date(),
  period_month: z.string().trim().min(1),
  notes: z.string().trim().max(500).nullable().optional()
})
