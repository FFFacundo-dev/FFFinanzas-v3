import postgres from 'postgres'
import { env } from './env.js'

const sql = postgres(env.databaseUrl, {
  ssl: 'require',
  // Devolver columnas `date` (OID 1082) como strings 'YYYY-MM-DD' en vez de Date a
  // medianoche UTC (evita el off-by-one al formatear en zonas UTC-negativas).
  types: {
    date: {
      to: 1082,
      from: [1082],
      serialize: (value) => value,
      parse: (value) => value
    }
  },
  onconnect: (conn) => conn`SET TIME ZONE 'America/Argentina/Buenos_Aires'`
})

export async function checkDatabaseConnection() {
  await sql`SELECT 1`
}

export default sql
