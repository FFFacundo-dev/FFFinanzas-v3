import { env } from './config/env.js'
import { checkDatabaseConnection } from './config/db.js'
import { createApp } from './app.js'

async function startServer() {
  try {
    await checkDatabaseConnection()
    console.log('Database connection OK')

    const app = createApp()
    app.listen(env.port, () => {
      console.log(`Server listening on http://localhost:${env.port}`)
    })
  } catch (error) {
    console.error('Failed to start backend:', error.message)
    process.exit(1)
  }
}

startServer()
