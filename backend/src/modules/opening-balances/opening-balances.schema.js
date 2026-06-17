import { z } from 'zod'

export const openingBalanceBodySchema = z.object({
  currency_code: z.string().trim().min(1).max(10),
  amount: z.coerce.number().finite()
})
