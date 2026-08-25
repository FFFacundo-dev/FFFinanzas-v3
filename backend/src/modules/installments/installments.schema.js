import { z } from 'zod'

const baseInstallment = z.object({
  account_id: z.string().uuid().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  description: z.string().trim().min(1, 'La descripcion es obligatoria').max(500),
  currency_code: z.string().trim().max(10).optional().default('ARS'),
  billing_day: z.coerce.number().int().min(0).max(31).nullable().optional(),
  start_date: z.string().date(),
  paid_installments_initial: z.coerce.number().int().min(0).optional().default(0),
  status: z.enum(['ACTIVE', 'FINISHED', 'CANCELLED']).optional().default('ACTIVE'),
  total_amount: z.coerce.number().positive()
})

export const installmentCreateSchema = z.discriminatedUnion('mode', [
  baseInstallment.extend({ mode: z.literal('auto'), total_installments: z.coerce.number().int().positive() }),
  baseInstallment.extend({ mode: z.literal('custom'), installment_amount: z.coerce.number().positive() })
])

export const installmentUpdateSchema = baseInstallment.extend({
  total_installments: z.coerce.number().int().positive(),
  default_amount: z.coerce.number().positive().nullable().optional()
})

export const installmentPaymentSchema = z.object({
  installment_id: z.string().uuid(),
  installment_number: z.coerce.number().int().positive(),
  amount_override: z.coerce.number().positive().nullable().optional(),
  account_id: z.string().uuid().nullable().optional(),
  // Si viene, el pago se cubre liberando lo reservado en esa meta (misma moneda).
  goal_id: z.string().uuid().nullable().optional(),
  payment_date: z.string().date(),
  notes: z.string().trim().max(500).nullable().optional()
})

export const installmentAdvanceSchema = z.object({
  installment_id: z.string().uuid(),
  installments_count: z.coerce.number().int().positive(),
  account_id: z.string().uuid().nullable().optional(),
  payment_date: z.string().date(),
  applies_from_month: z.string().trim().min(1),
  notes: z.string().trim().max(500).nullable().optional()
})
