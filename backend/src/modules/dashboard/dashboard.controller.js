import * as service from './dashboard.service.js'

export async function balanceByCurrency(req, res) {
  res.json({ ok: true, data: await service.balanceByCurrency(req.auth.userId) })
}

export async function balancesSummary(req, res) {
  res.json({ ok: true, data: await service.balancesSummary(req.auth.userId) })
}

export async function spendingByAccount(req, res) {
  res.json({ ok: true, data: await service.spendingByAccount(req.auth.userId) })
}

export async function installmentProgress(req, res) {
  res.json({ ok: true, data: await service.installmentProgress(req.auth.userId) })
}
