import { z } from 'zod'

export const transactionsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  account_id: z.string().uuid().optional(),
  category_id: z.string().uuid().optional(),
  movement_type: z.enum(['EXPENSE', 'INCOME']).optional(),
  currency_code: z.string().trim().max(10).optional(),
  date_from: z.string().date().optional(),
  date_to: z.string().date().optional()
})

const baseTransactionObject = z.object({
  account_id: z.string().uuid().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  group_id: z.string().uuid().nullable().optional(),
  movement_type: z.enum(['EXPENSE', 'INCOME']),
  currency_code: z.string().trim().min(1).max(10),
  amount: z.coerce.number().positive(),
  description: z.string().trim().min(1, 'La descripcion es obligatoria').max(500),
  date: z.string().date()
})

// EXPENSE requiere cuenta; INCOME va sin cuenta (es del usuario).
export const transactionBodySchema = baseTransactionObject.refine(
  (data) => data.movement_type === 'INCOME' || Boolean(data.account_id),
  { message: 'account_id is required for expenses', path: ['account_id'] }
)

export const partialTransactionBodySchema = baseTransactionObject
  .partial()
  .refine((payload) => Object.keys(payload).length > 0, { message: 'At least one field must be provided' })
