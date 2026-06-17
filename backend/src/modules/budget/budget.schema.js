import { z } from 'zod'

export const budgetItemSchema = z.object({
  period_month: z.string().trim().min(1),
  label: z.string().trim().min(1, 'El label es obligatorio'),
  amount: z.coerce.number().positive(),
  flow_type: z.enum(['EXPENSE', 'INCOME']),
  currency_code: z.string().trim().max(10).optional().default('ARS'),
  item_type: z.enum(['SUBSCRIPTION', 'ONE_TIME', 'INSTALLMENT']),
  subscription_id: z.string().uuid().nullable().optional(),
  installment_id: z.string().uuid().nullable().optional()
}).superRefine((data, ctx) => {
  if (data.subscription_id && data.installment_id) {
    ctx.addIssue({ code: 'custom', message: 'Only one reference is allowed', path: ['installment_id'] })
  }
  if (data.flow_type === 'INCOME') {
    if (data.item_type !== 'ONE_TIME') {
      ctx.addIssue({ code: 'custom', message: 'Income items must be ONE_TIME', path: ['item_type'] })
    }
    if (data.subscription_id || data.installment_id) {
      ctx.addIssue({ code: 'custom', message: 'Income items cannot reference subscriptions or installments', path: ['flow_type'] })
    }
  }
})

export const budgetSettingsSchema = z.object({
  period_month: z.string().trim().min(1),
  currency_code: z.string().trim().min(1).max(10),
  surplus: z.coerce.number().finite()
})
