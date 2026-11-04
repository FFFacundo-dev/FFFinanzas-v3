import * as service from './reports.service.js'

export async function subscriptionDebtByCategory(req, res) {
  res.json({ ok: true, data: await service.subscriptionDebtByCategory(req.auth.userId) })
}

export async function subscriptionDebtByAccount(req, res) {
  res.json({ ok: true, data: await service.subscriptionDebtByAccount(req.auth.userId) })
}

export async function installmentDebtByCategory(req, res) {
  res.json({ ok: true, data: await service.installmentDebtByCategory(req.auth.userId) })
}

export async function installmentDebtByAccount(req, res) {
  res.json({ ok: true, data: await service.installmentDebtByAccount(req.auth.userId) })
}

export async function monthlyCashflow(req, res) {
  res.json({ ok: true, data: await service.monthlyCashflow(req.auth.userId, req.validated.query) })
}

export async function categoryBreakdown(req, res) {
  const { data, meta } = await service.categoryBreakdown(req.auth.userId, req.validated.query)
  res.json({ ok: true, data, meta })
}
