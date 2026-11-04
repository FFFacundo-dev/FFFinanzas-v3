import { toast } from 'sonner'

/**
 * Corre una mutación de RTK Query y avisa por toast en los dos casos.
 * Reemplaza el try/catch/toast que estaba repetido en cada handler.
 *
 *   const { ok, data } = await runMutation(crearMeta(body), { success: 'Meta creada' })
 *   if (!ok) return
 *
 * `error` es el texto de fallback: si el backend mandó un mensaje, gana el del backend
 * (apiSlice ya lo normaliza en `err.message`).
 */
export async function runMutation(promise, { success, error = 'No se pudo completar la acción' } = {}) {
  try {
    const data = await promise.unwrap()
    if (success) toast.success(success)
    return { ok: true, data }
  } catch (err) {
    toast.error(err?.message ?? error)
    return { ok: false, error: err }
  }
}
