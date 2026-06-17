import { ZodError } from 'zod'
import { HttpError } from '../utils/http-error.js'

function formatIssues(issues) {
  return issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }))
}

function makeValidator(target) {
  return (schema) => (req, _res, next) => {
    try {
      req.validated = req.validated || {}
      req.validated[target] = schema.parse(req[target])
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        return next(new HttpError(400, 'Validation error', { issues: formatIssues(error.issues) }))
      }
      return next(error)
    }
  }
}

export const validateBody = makeValidator('body')
export const validateQuery = makeValidator('query')
