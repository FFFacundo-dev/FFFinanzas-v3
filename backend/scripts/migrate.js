// Aplica los .sql de backend/migrations/ en orden, una sola vez cada uno.
//
//   npm run migrate                     aplica lo pendiente
//   npm run migrate -- --dry            lista lo pendiente sin tocar la DB
//   npm run migrate -- --baseline 008   marca 001..008 como aplicadas sin ejecutarlas
//
// El baseline es para la DB que ya venia con el schema puesto a mano: registra como
// aplicado lo que ya esta en la DB para que el runner arranque desde ahi. El numero
// corta hasta donde llega esa DB; lo que viene despues se aplica normal con `migrate`.
//
// ponytail: cada archivo corre entero dentro de una transaccion y queda registrado
// en schema_migrations. Sin rollback ni migraciones "down": para volver atras se
// escribe un archivo nuevo que deshaga, que es lo que uno termina haciendo igual.
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sql from '../src/config/db.js'

const MIGRATIONS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'migrations')

async function listMigrations() {
  const files = await readdir(MIGRATIONS_DIR)
  return files.filter((f) => f.endsWith('.sql')).sort()
}

async function appliedVersions() {
  await sql`
    CREATE TABLE IF NOT EXISTS public.schema_migrations (
      version    text        PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `
  const rows = await sql`SELECT version FROM public.schema_migrations`
  return new Set(rows.map((r) => r.version))
}

async function main() {
  const baselineIndex = process.argv.indexOf('--baseline')
  const mode = baselineIndex !== -1
    ? 'baseline'
    : process.argv.includes('--dry') ? 'dry' : 'apply'
  // Hasta que numero de migracion llega la DB que estamos marcando (default: todas).
  const baselineUpto = process.argv[baselineIndex + 1] ?? ''

  const all = await listMigrations()
  const applied = await appliedVersions()
  let pending = all.filter((version) => !applied.has(version))

  if (mode === 'baseline' && baselineUpto) {
    const cut = pending.findIndex((version) => version.startsWith(baselineUpto))
    if (cut === -1) throw new Error(`No hay migracion pendiente que empiece con "${baselineUpto}"`)
    pending = pending.slice(0, cut + 1)
  }

  if (pending.length === 0) {
    console.log(`Sin migraciones pendientes (${applied.size} aplicadas).`)
    return
  }

  if (mode === 'dry') {
    console.log('Pendientes:')
    pending.forEach((version) => console.log(`  ${version}`))
    return
  }

  if (mode === 'baseline') {
    await sql`
      INSERT INTO public.schema_migrations ${sql(pending.map((version) => ({ version })))}
      ON CONFLICT (version) DO NOTHING
    `
    console.log(`Baseline: ${pending.length} migraciones marcadas como aplicadas (sin ejecutar).`)
    return
  }

  for (const version of pending) {
    const statements = await readFile(path.join(MIGRATIONS_DIR, version), 'utf8')
    process.stdout.write(`  ${version} ... `)
    await sql.begin(async (tx) => {
      await tx.unsafe(statements)
      await tx`INSERT INTO public.schema_migrations (version) VALUES (${version})`
    })
    console.log('ok')
  }
  console.log(`${pending.length} migraciones aplicadas.`)
}

try {
  await main()
} catch (error) {
  console.error('Migracion fallida:', error.message)
  process.exitCode = 1
} finally {
  await sql.end()
}
