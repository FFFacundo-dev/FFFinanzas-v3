import sql from '../../config/db.js'
import { HttpError } from '../../utils/http-error.js'

const PROGRESS_COLUMNS = sql`goal_id AS id, user_id, name, currency_code, target_amount,
  deadline, status, current_amount, is_completed, parent_id, created_at, updated_at`

// Tolerancia para comparar montos numeric (evita falsos negativos por float).
const EPS = 1e-9

async function getGoal(userId, id) {
  const rows = await sql`
    SELECT ${PROGRESS_COLUMNS} FROM public.v_goal_progress
    WHERE goal_id = ${id} AND user_id = ${userId}
  `
  if (rows.length === 0) throw new HttpError(404, 'Goal not found')
  return rows[0]
}

// Rechaza nombres repetidos (case-insensitive + trim). excludeId omite la propia meta al editar.
async function assertNameAvailable(userId, name, excludeId = null) {
  const rows = await sql`
    SELECT 1 FROM public.goals
    WHERE user_id = ${userId}
      AND lower(trim(name)) = ${name.trim().toLowerCase()}
      AND (${excludeId}::uuid IS NULL OR id <> ${excludeId}::uuid)
    LIMIT 1
  `
  if (rows.length > 0) throw new HttpError(409, 'Ya existe una meta con ese nombre')
}

// Valida que `parentId` pueda agrupar a la meta `childId` (de moneda `childCurrency`).
// Reglas: padre existe y es del usuario, misma moneda, un solo nivel (el padre no es hijo
// de otro y la hija no agrupa a su vez otras), y no se agrupa a sí misma.
async function assertValidParent(userId, childId, parentId, childCurrency) {
  if (!parentId) return
  if (parentId === childId) throw new HttpError(422, 'Una meta no puede agruparse a sí misma')
  const rows = await sql`
    SELECT currency_code, parent_id FROM public.goals
    WHERE id = ${parentId} AND user_id = ${userId}
  `
  if (rows.length === 0) throw new HttpError(422, 'La meta padre no existe')
  if (rows[0].parent_id) throw new HttpError(422, 'No se pueden anidar grupos: la meta padre ya pertenece a otro grupo')
  if (rows[0].currency_code !== childCurrency) throw new HttpError(422, 'La meta padre debe ser de la misma moneda')
  if (childId) {
    const kids = await sql`SELECT 1 FROM public.goals WHERE parent_id = ${childId} LIMIT 1`
    if (kids.length > 0) throw new HttpError(422, 'Esta meta ya agrupa otras: no puede pertenecer a un grupo')
  }
}

async function availableFor(userId, currencyCode) {
  const rows = await sql`
    SELECT available_balance FROM public.v_user_balances_summary
    WHERE user_id = ${userId} AND currency_code = ${currencyCode}
  `
  return rows.length ? Number(rows[0].available_balance) : 0
}

export function listGoals(userId, status) {
  const normalized = status ? String(status).toUpperCase() : null
  if (normalized === 'ACTIVE' || normalized === 'ARCHIVED') {
    return sql`
      SELECT ${PROGRESS_COLUMNS} FROM public.v_goal_progress
      WHERE user_id = ${userId} AND status = ${normalized}
      ORDER BY created_at DESC
    `
  }
  return sql`
    SELECT ${PROGRESS_COLUMNS} FROM public.v_goal_progress
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `
}

export async function createGoal(userId, payload) {
  await assertNameAvailable(userId, payload.name)
  const currency = String(payload.currency_code).trim().toUpperCase()
  await assertValidParent(userId, null, payload.parent_id ?? null, currency)
  const rows = await sql`
    INSERT INTO public.goals (user_id, name, target_amount, currency_code, deadline, parent_id)
    VALUES (${userId}, ${payload.name.trim()}, ${payload.target_amount ?? null}, ${currency},
            ${payload.deadline || null}, ${payload.parent_id ?? null})
    RETURNING id
  `
  return getGoal(userId, rows[0].id)
}

export async function updateGoal(userId, id, payload) {
  await assertNameAvailable(userId, payload.name, id)
  const existing = await getGoal(userId, id) // valida pertenencia + moneda (no editable)
  await assertValidParent(userId, id, payload.parent_id ?? null, existing.currency_code)
  await sql`
    UPDATE public.goals
    SET name = ${payload.name.trim()}, target_amount = ${payload.target_amount ?? null},
        deadline = ${payload.deadline || null}, parent_id = ${payload.parent_id ?? null}
    WHERE id = ${id} AND user_id = ${userId}
  `
  return getGoal(userId, id)
}

export async function patchGoalStatus(userId, id, status) {
  const rows = await sql`
    UPDATE public.goals SET status = ${status}
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING id
  `
  if (rows.length === 0) throw new HttpError(404, 'Goal not found')
  return getGoal(userId, id)
}

export async function deleteGoal(userId, id) {
  // Cascada en goal_movements → la reserva se libera sola.
  const rows = await sql`DELETE FROM public.goals WHERE id = ${id} AND user_id = ${userId} RETURNING id`
  if (rows.length === 0) throw new HttpError(404, 'Goal not found')
}

export async function listGoalMovements(userId, goalId) {
  await getGoal(userId, goalId) // valida pertenencia
  return sql`
    SELECT id, goal_id, movement_type, amount, date, created_at
    FROM public.goal_movements
    WHERE goal_id = ${goalId} AND user_id = ${userId}
    ORDER BY date DESC, created_at DESC
  `
}

export async function createGoalMovement(userId, goalId, payload) {
  const goal = await getGoal(userId, goalId)
  if (goal.status === 'ARCHIVED') {
    throw new HttpError(422, 'La meta está archivada')
  }
  const kids = await sql`SELECT 1 FROM public.goals WHERE parent_id = ${goalId} LIMIT 1`
  if (kids.length > 0) {
    throw new HttpError(422, 'Esta meta agrupa otras: aportá o retirá en las metas hijas')
  }
  const amount = Number(payload.amount)

  if (payload.movement_type === 'ALLOCATE') {
    // Llegar al objetivo NO frena: el único límite es el disponible.
    const available = await availableFor(userId, goal.currency_code)
    if (amount > available + EPS) {
      throw new HttpError(422, `No tenés suficiente disponible en ${goal.currency_code}`)
    }
  } else {
    const current = Number(goal.current_amount)
    if (amount > current + EPS) {
      throw new HttpError(422, 'No podés retirar más de lo reservado en la meta')
    }
  }

  const rows = await sql`
    INSERT INTO public.goal_movements (goal_id, user_id, movement_type, amount)
    VALUES (${goalId}, ${userId}, ${payload.movement_type}, ${amount})
    RETURNING id, goal_id, movement_type, amount, date, created_at
  `
  return { movement: rows[0], goal: await getGoal(userId, goalId) }
}
