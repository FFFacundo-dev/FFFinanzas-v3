import { registerUser, loginUser, getCurrentUser } from './auth.service.js'

export async function register(req, res) {
  const result = await registerUser(req.validated.body)
  res.status(201).json({ ok: true, ...result })
}

export async function login(req, res) {
  const result = await loginUser(req.validated.body)
  res.json({ ok: true, ...result })
}

export async function me(req, res) {
  const user = await getCurrentUser(req.auth.userId)
  res.json({ ok: true, user })
}
