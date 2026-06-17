import { z } from 'zod'

export const exchangeBodySchema = z.object({
  from_currency_code: z.string().trim().min(1).max(10),
  to_currency_code: z.string().trim().min(1).max(10),
  from_amount: z.coerce.number().positive(),
  to_amount: z.coerce.number().positive(),
  description: z.string().trim().max(500).nullable().optional(),
  date: z.string().date()
}).refine(
  (data) => data.from_currency_code.toUpperCase() !== data.to_currency_code.toUpperCase(),
  { message: 'from and to currencies must differ', path: ['to_currency_code'] }
)
