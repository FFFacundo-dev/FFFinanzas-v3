import * as service from './categories.service.js'

export async function list(req, res) {
  res.json({ ok: true, data: await service.listCategories(req.auth.userId) })
}

export async function create(req, res) {
  const data = await service.createCategory(req.auth.userId, req.validated.body.name)
  res.status(201).json({ ok: true, data })
}

export async function update(req, res) {
  const data = await service.updateCategory(req.auth.userId, req.params.id, req.validated.body.name)
  res.json({ ok: true, data })
}

export async function remove(req, res) {
  await service.deleteCategory(req.auth.userId, req.params.id)
  res.json({ ok: true })
}
