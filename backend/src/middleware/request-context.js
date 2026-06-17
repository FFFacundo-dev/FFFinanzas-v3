import { randomUUID } from 'node:crypto'

export function requestContextMiddleware(req, res, next) {
  const requestId = req.headers['x-request-id'] || randomUUID()
  req.requestId = String(requestId)
  res.setHeader('x-request-id', req.requestId)
  next()
}
