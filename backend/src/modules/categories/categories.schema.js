import { z } from 'zod'

export const categoryBodySchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(100)
})
