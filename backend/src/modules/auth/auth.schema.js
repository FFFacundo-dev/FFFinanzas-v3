import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6),
  preferredLanguage: z.string().trim().max(10).optional()
})

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1)
})
