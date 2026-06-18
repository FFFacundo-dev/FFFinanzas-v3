/**
 * Migracion de datos FFFinanzas v2 (ledger por cuenta) -> v3 (fondo unico).
 *
 * Lee de la base v2 y escribe en la base v3 (ya creada con schema-v3.sql, solo con
 * el catalogo de currencies). Preserva los UUIDs para mantener validas todas las FKs.
 *
 * Mapeo (PLAN.md D5):
 *  - accounts -> etiquetas (se descartan currency_code e initial_balance).
 *  - user_opening_balances = SUM(accounts.initial_balance) por (user, moneda).
 *  - transactions heredan la moneda de su cuenta v2.
 *  - transfers de MISMA moneda  -> se descartan (eran neutrales al pozo).
 *  - transfers CROSS-moneda     -> exchanges.
 *  - installment_advance_payments pierden paying_account_id / transfer_id.
 *  - Validacion: pozo por (user, moneda) en v3 == saldo total v2.
 *
 * Uso:
 *   V2_DATABASE_URL=postgres://...  V3_DATABASE_URL=postgres://...  node scripts/migrate-v2-to-v3.js
 *   (V3_DATABASE_URL cae a DATABASE_URL si no se define.)
 *   FORCE=1 para correr aunque la base v3 ya tenga usuarios.
 */
import 'dotenv/config'
import postgres from 'postgres'

const V2_URL = process.env.V2_DATABASE_URL
const V3_URL = process.env.V3_DATABASE_URL || process.env.DATABASE_URL

if (!V2_URL || !V3_URL) {
  console.error('Faltan V2_DATABASE_URL y/o V3_DATABASE_URL (o DATABASE_URL).')
  process.exit(1)
}

// Mantener las columnas `date` como 'YYYY-MM-DD' (mismo criterio que config/db.js).
const dateAsString = {
  types: { date: { to: 1082, from: [1082], serialize: (v) => v, parse: (v) => v } }
}

const v2 = postgres(V2_URL, { ssl: 'require', ...dateAsString })
const v3 = postgres(V3_URL, { ssl: 'require', ...dateAsString })

function pick(row, columns) {
  const out = {}
  for (const col of columns) out[col] = row[col] ?? null
  return out
}

async function bulkInsert(tx, table, rows, columns) {
  if (!rows.length) return 0
  const shaped = rows.map((row) => pick(row, columns))
  await tx`INSERT INTO ${tx(table)} ${tx(shaped, ...columns)}`
  return shaped.length
}

async function run() {
  console.log('Leyendo datos de v2...')

  const [
    users, allowedUsers, categories, accountsV2, groups,
    transactionsV2, transfersV2, subscriptions, subscriptionPayments,
    installments, installmentPayments, advancePayments, budgetItems
  ] = await Promise.all([
    v2`SELECT id, email, password_hash, preferred_language, created_at, updated_at FROM public.users ORDER BY id`,
    v2`SELECT id, email, full_name, is_active, notes, created_at, updated_at FROM public.allowed_users ORDER BY id`,
    v2`SELECT id, user_id, name, created_at, updated_at FROM public.categories`,
    v2`SELECT id, user_id, name, account_type, color, icon, is_active, currency_code, initial_balance, created_at, updated_at FROM public.accounts`,
    v2`SELECT id, user_id, name, description, created_at, updated_at FROM public.transaction_groups`,
    v2`SELECT id, user_id, account_id, category_id, group_id, movement_type, amount, description, date, created_at, updated_at FROM public.transactions`,
    v2`SELECT id, user_id, from_account_id, to_account_id, from_amount, to_amount, exchange_rate, description, date, created_at, updated_at FROM public.transfers`,
    v2`SELECT id, user_id, category_id, name, description, currency_code, default_amount, account_id, billing_day, start_date, status, created_at, updated_at FROM public.subscriptions`,
    v2`SELECT id, subscription_id, user_id, account_id, amount, payment_date, period_month, transaction_id, notes, created_at, updated_at FROM public.subscription_payments`,
    v2`SELECT id, user_id, account_id, category_id, description, currency_code, total_installments, total_amount, default_amount, billing_day, start_date, paid_installments_initial, status, created_at, updated_at FROM public.installments`,
    v2`SELECT id, installment_id, user_id, installment_number, amount_override, payment_date, transaction_id, notes, created_at, updated_at FROM public.installment_payments`,
    v2`SELECT id, installment_id, user_id, installments_count, total_amount, payment_date, applies_from_month, transaction_id, notes, created_at, updated_at FROM public.installment_advance_payments`,
    v2`SELECT id, user_id, period_month, label, amount, flow_type, currency_code, item_type, subscription_id, installment_id, created_at, updated_at FROM public.budget_items`
  ])

  let budgetSettings = []
  try {
    budgetSettings = await v2`SELECT user_id, period_month, currency_code, surplus FROM public.budget_settings`
  } catch (_e) {
    console.warn('  (sin budget_settings en v2 o forma distinta; se omite)')
  }

  // Mapa cuenta -> moneda (v2).
  const acctCurrency = new Map(accountsV2.map((a) => [a.id, a.currency_code]))

  // Apertura por (user, moneda) = suma de initial_balance.
  const openingMap = new Map()
  for (const a of accountsV2) {
    const key = `${a.user_id}|${a.currency_code}`
    openingMap.set(key, Number(openingMap.get(key) || 0) + Number(a.initial_balance || 0))
  }
  const openingRows = [...openingMap.entries()].map(([key, amount]) => {
    const [user_id, currency_code] = key.split('|')
    return { user_id: Number(user_id), currency_code, amount }
  })

  // Transactions con moneda heredada.
  const txRows = transactionsV2.map((t) => ({
    ...t,
    currency_code: acctCurrency.get(t.account_id) || 'ARS'
  }))

  // Transfers cross-moneda -> exchanges; same-moneda se descartan.
  const exchangeRows = []
  let droppedTransfers = 0
  for (const tr of transfersV2) {
    const fromCur = acctCurrency.get(tr.from_account_id)
    const toCur = acctCurrency.get(tr.to_account_id)
    if (fromCur === toCur) { droppedTransfers += 1; continue }
    exchangeRows.push({
      id: tr.id,
      user_id: tr.user_id,
      from_currency_code: fromCur,
      to_currency_code: toCur,
      from_amount: tr.from_amount,
      to_amount: tr.to_amount,
      exchange_rate: tr.exchange_rate != null
        ? tr.exchange_rate
        : Number((Number(tr.to_amount) / Number(tr.from_amount)).toFixed(6)),
      description: tr.description,
      date: tr.date,
      created_at: tr.created_at,
      updated_at: tr.updated_at
    })
  }

  console.log(`Insertando en v3 (users=${users.length}, accounts=${accountsV2.length}, tx=${txRows.length}, exchanges=${exchangeRows.length}, transfers descartadas=${droppedTransfers})...`)

  await v3.begin(async (tx) => {
    const existing = await tx`SELECT COUNT(*)::int AS n FROM public.users`
    if (existing[0].n > 0 && process.env.FORCE !== '1') {
      throw new Error('La base v3 ya tiene usuarios. Use FORCE=1 para forzar (puede duplicar datos).')
    }

    // users / allowed_users: id es IDENTITY -> OVERRIDING SYSTEM VALUE.
    for (const u of users) {
      await tx`
        INSERT INTO public.users (id, email, password_hash, preferred_language, created_at, updated_at)
        OVERRIDING SYSTEM VALUE
        VALUES (${u.id}, ${u.email}, ${u.password_hash}, ${u.preferred_language}, ${u.created_at}, ${u.updated_at})
      `
    }
    for (const a of allowedUsers) {
      await tx`
        INSERT INTO public.allowed_users (id, email, full_name, is_active, notes, created_at, updated_at)
        OVERRIDING SYSTEM VALUE
        VALUES (${a.id}, ${a.email}, ${a.full_name}, ${a.is_active}, ${a.notes}, ${a.created_at}, ${a.updated_at})
      `
    }
    // Reajustar las secuencias de identidad.
    if (users.length) await tx`SELECT setval(pg_get_serial_sequence('public.users','id'), (SELECT MAX(id) FROM public.users))`
    if (allowedUsers.length) await tx`SELECT setval(pg_get_serial_sequence('public.allowed_users','id'), (SELECT MAX(id) FROM public.allowed_users))`

    await bulkInsert(tx, 'public.categories', categories, ['id', 'user_id', 'name', 'created_at', 'updated_at'])
    await bulkInsert(tx, 'public.accounts', accountsV2, ['id', 'user_id', 'name', 'account_type', 'color', 'icon', 'is_active', 'created_at', 'updated_at'])
    await bulkInsert(tx, 'public.transaction_groups', groups, ['id', 'user_id', 'name', 'description', 'created_at', 'updated_at'])
    await bulkInsert(tx, 'public.user_opening_balances', openingRows, ['user_id', 'currency_code', 'amount'])
    await bulkInsert(tx, 'public.transactions', txRows, ['id', 'user_id', 'account_id', 'category_id', 'group_id', 'movement_type', 'currency_code', 'amount', 'description', 'date', 'created_at', 'updated_at'])
    await bulkInsert(tx, 'public.exchanges', exchangeRows, ['id', 'user_id', 'from_currency_code', 'to_currency_code', 'from_amount', 'to_amount', 'exchange_rate', 'description', 'date', 'created_at', 'updated_at'])
    await bulkInsert(tx, 'public.subscriptions', subscriptions, ['id', 'user_id', 'category_id', 'name', 'description', 'currency_code', 'default_amount', 'account_id', 'billing_day', 'start_date', 'status', 'created_at', 'updated_at'])
    await bulkInsert(tx, 'public.subscription_payments', subscriptionPayments, ['id', 'subscription_id', 'user_id', 'account_id', 'amount', 'payment_date', 'period_month', 'transaction_id', 'notes', 'created_at', 'updated_at'])
    await bulkInsert(tx, 'public.installments', installments, ['id', 'user_id', 'account_id', 'category_id', 'description', 'currency_code', 'total_installments', 'total_amount', 'default_amount', 'billing_day', 'start_date', 'paid_installments_initial', 'status', 'created_at', 'updated_at'])
    await bulkInsert(tx, 'public.installment_payments', installmentPayments, ['id', 'installment_id', 'user_id', 'installment_number', 'amount_override', 'payment_date', 'transaction_id', 'notes', 'created_at', 'updated_at'])
    await bulkInsert(tx, 'public.installment_advance_payments', advancePayments, ['id', 'installment_id', 'user_id', 'installments_count', 'total_amount', 'payment_date', 'applies_from_month', 'transaction_id', 'notes', 'created_at', 'updated_at'])
    await bulkInsert(tx, 'public.budget_items', budgetItems, ['id', 'user_id', 'period_month', 'label', 'amount', 'flow_type', 'currency_code', 'item_type', 'subscription_id', 'installment_id', 'created_at', 'updated_at'])
    await bulkInsert(tx, 'public.budget_settings', budgetSettings, ['user_id', 'period_month', 'currency_code', 'surplus'])
  })

  // Validacion: pozo por (user, moneda) debe coincidir con el saldo total de v2.
  console.log('Validando pozos por moneda...')
  const v2Ref = await v2`
    SELECT user_id, currency_code, SUM(current_balance)::numeric AS total
    FROM public.v_account_balance
    GROUP BY user_id, currency_code
  `
  const v3Pool = await v3`
    SELECT user_id, currency_code, total_balance AS total
    FROM public.v_user_balance_by_currency
  `
  const v3Map = new Map(v3Pool.map((r) => [`${r.user_id}|${r.currency_code}`, Number(r.total)]))
  let mismatches = 0
  for (const ref of v2Ref) {
    const key = `${ref.user_id}|${ref.currency_code}`
    const v3Val = v3Map.get(key) ?? 0
    const diff = Math.abs(Number(ref.total) - v3Val)
    if (diff > 0.01) {
      mismatches += 1
      console.error(`  MISMATCH ${key}: v2=${Number(ref.total).toFixed(2)} v3=${v3Val.toFixed(2)} (diff ${diff.toFixed(2)})`)
    }
  }

  if (mismatches === 0) {
    console.log('OK: todos los pozos por (usuario, moneda) coinciden con v2.')
  } else {
    console.error(`ATENCION: ${mismatches} discrepancia(s). Revisar antes de usar la base v3.`)
  }

  console.log('Migracion finalizada.')
}

run()
  .then(async () => { await v2.end(); await v3.end(); process.exit(0) })
  .catch(async (error) => {
    console.error('Migracion ABORTADA:', error.message)
    await v2.end(); await v3.end(); process.exit(1)
  })
