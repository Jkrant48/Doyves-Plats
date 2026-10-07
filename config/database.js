import 'dotenv/config'
import process from 'node:process'
import pg from 'pg'

const { Pool } = pg
const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is required. Configure it in your .env file.')
}

const databaseUrl = new URL(connectionString)
const isLocalDatabase = ['localhost', '127.0.0.1', '::1'].includes(
  databaseUrl.hostname,
)

export const pool = new Pool({
  connectionString,
  ssl: isLocalDatabase ? false : { rejectUnauthorized: true },
  connectionTimeoutMillis: 10_000,
  keepAlive: true,
})

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error)
})
