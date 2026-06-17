// Envuelve handlers async para que cualquier throw vaya al error-handler de Express.
export function asyncHandler(fn) {
  return async function wrapped(req, res, next) {
    try {
      await fn(req, res, next)
    } catch (error) {
      next(error)
    }
  }
}
